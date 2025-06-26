import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '../lib/supabase';

export const useLoginAsUserStore = create(
  persist(
    (set, get) => ({
      isImpersonating: false,
      originalAdmin: null,
      targetUser: null,
      impersonationSession: null,
      auditLog: [],

      // Login as another user
      loginAsUser: async (impersonationData) => {
        try {
          const session = {
            id: `impersonation_${Date.now()}`,
            originalAdmin: impersonationData.originalAdmin,
            targetUser: impersonationData.targetUser,
            startTime: impersonationData.timestamp,
            reason: impersonationData.reason || 'Customer support',
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
            actions: []
          };

          // Log the impersonation start
          const auditEntry = {
            id: `audit_${Date.now()}`,
            type: 'IMPERSONATION_START',
            adminId: impersonationData.originalAdmin.id,
            adminEmail: impersonationData.originalAdmin.email,
            targetUserId: impersonationData.targetUser.id,
            targetUserEmail: impersonationData.targetUser.email,
            timestamp: impersonationData.timestamp,
            reason: impersonationData.reason,
            sessionId: session.id,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent
          };

          // Store to database
          await logImpersonationEvent(auditEntry);

          set({
            isImpersonating: true,
            originalAdmin: impersonationData.originalAdmin,
            targetUser: impersonationData.targetUser,
            impersonationSession: session,
            auditLog: [...get().auditLog, auditEntry]
          });

          return session;
        } catch (error) {
          console.error('Failed to start impersonation:', error);
          throw error;
        }
      },

      // Log an action performed while impersonating
      logAction: async (action) => {
        const { impersonationSession, auditLog } = get();
        if (!impersonationSession) return;

        const actionEntry = {
          id: `action_${Date.now()}`,
          sessionId: impersonationSession.id,
          action: action.type,
          details: action.details,
          timestamp: new Date().toISOString(),
          path: window.location.pathname,
          data: action.data
        };

        // Update session actions
        const updatedSession = {
          ...impersonationSession,
          actions: [...impersonationSession.actions, actionEntry]
        };

        const auditEntry = {
          id: `audit_${Date.now()}`,
          type: 'IMPERSONATION_ACTION',
          adminId: impersonationSession.originalAdmin.id,
          adminEmail: impersonationSession.originalAdmin.email,
          targetUserId: impersonationSession.targetUser.id,
          targetUserEmail: impersonationSession.targetUser.email,
          action: action.type,
          details: action.details,
          timestamp: new Date().toISOString(),
          sessionId: impersonationSession.id
        };

        set({
          impersonationSession: updatedSession,
          auditLog: [...auditLog, auditEntry]
        });

        // Send to backend
        try {
          await logImpersonationEvent(auditEntry);
        } catch (error) {
          console.error('Failed to log action:', error);
        }
      },

      // End impersonation session
      endImpersonation: async () => {
        const { impersonationSession, auditLog } = get();
        if (!impersonationSession) return;

        const auditEntry = {
          id: `audit_${Date.now()}`,
          type: 'IMPERSONATION_END',
          adminId: impersonationSession.originalAdmin.id,
          adminEmail: impersonationSession.originalAdmin.email,
          targetUserId: impersonationSession.targetUser.id,
          targetUserEmail: impersonationSession.targetUser.email,
          timestamp: new Date().toISOString(),
          sessionId: impersonationSession.id,
          duration: new Date().getTime() - new Date(impersonationSession.startTime).getTime(),
          actionsPerformed: impersonationSession.actions.length
        };

        // Send final audit log
        try {
          await logImpersonationEvent(auditEntry);
        } catch (error) {
          console.error('Failed to log impersonation end:', error);
        }

        // Clear impersonation state immediately
        set({
          isImpersonating: false,
          originalAdmin: null,
          targetUser: null,
          impersonationSession: null,
          auditLog: [...auditLog, auditEntry]
        });

        // Clear any cached auth state
        try {
          // Force a clean state by clearing auth store if needed
          const { useAuthStore } = await import('./authStore');
          const authStore = useAuthStore.getState();
          if (authStore.reinitialize) {
            await authStore.reinitialize();
          }
        } catch (error) {
          console.error('Error reinitializing auth:', error);
        }

        return true;
      },

      // Get current impersonation context
      getImpersonationContext: () => {
        const { isImpersonating, originalAdmin, targetUser, impersonationSession } = get();
        return {
          isImpersonating,
          originalAdmin,
          targetUser,
          session: impersonationSession
        };
      },

      // Get audit log for a specific user or session
      getAuditLog: (filters = {}) => {
        const { auditLog } = get();
        let filteredLog = auditLog;

        if (filters.adminId) {
          filteredLog = filteredLog.filter(entry => entry.adminId === filters.adminId);
        }

        if (filters.targetUserId) {
          filteredLog = filteredLog.filter(entry => entry.targetUserId === filters.targetUserId);
        }

        if (filters.sessionId) {
          filteredLog = filteredLog.filter(entry => entry.sessionId === filters.sessionId);
        }

        if (filters.startDate) {
          filteredLog = filteredLog.filter(entry => 
            new Date(entry.timestamp) >= new Date(filters.startDate)
          );
        }

        if (filters.endDate) {
          filteredLog = filteredLog.filter(entry => 
            new Date(entry.timestamp) <= new Date(filters.endDate)
          );
        }

        if (filters.type) {
          filteredLog = filteredLog.filter(entry => entry.type === filters.type);
        }

        return filteredLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      },

      // Clear old audit logs (keep last 1000 entries)
      cleanupAuditLog: () => {
        const { auditLog } = get();
        if (auditLog.length > 1000) {
          const sortedLog = auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          set({ auditLog: sortedLog.slice(0, 1000) });
        }
      }
    }),
    {
      name: 'login-as-user-store',
      partialize: (state) => ({
        auditLog: state.auditLog,
        // Don't persist active impersonation sessions for security
      })
    }
  )
);

// Helper function to get client IP (simplified)
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'Unknown';
  }
}

// Helper function to send audit logs to backend
async function logImpersonationEvent(auditEntry) {
  try {
    // For now, just log to console since we don't have the audit table set up
    console.log('Impersonation Audit Log:', auditEntry);
    
    // TODO: Store in Supabase audit table when implemented
    // const { error } = await supabase
    //   .from('sp_impersonation_audit_x7k9m2')
    //   .insert([{
    //     session_id: auditEntry.sessionId,
    //     event_type: auditEntry.type,
    //     admin_user_id: auditEntry.adminId,
    //     admin_email: auditEntry.adminEmail,
    //     target_user_id: auditEntry.targetUserId,
    //     target_user_email: auditEntry.targetUserEmail,
    //     action: auditEntry.action || null,
    //     details: auditEntry.details || null,
    //     reason: auditEntry.reason || null,
    //     ip_address: auditEntry.ipAddress || null,
    //     user_agent: auditEntry.userAgent || null,
    //     timestamp: auditEntry.timestamp,
    //     duration_ms: auditEntry.duration || null,
    //     actions_performed: auditEntry.actionsPerformed || null
    //   }]);

    // if (error) {
    //   console.error('Failed to log to database:', error);
    // }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}