import { create } from 'zustand';
import supabase from '../lib/supabase';
import { dbManager, liveDataService } from '../lib/database';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  clinics: [],
  selectedClinic: null,
  organization: null,
  error: null,

  initialize: async () => {
    try {
      dbManager.log('info', '🚀 Starting auth store initialization...');

      // Initialize database schema first
      const dbInitialized = await liveDataService.initialize();
      if (!dbInitialized) {
        dbManager.log('warn', 'Database initialization had issues, continuing with fallback...');
      }

      // Test queries
      await liveDataService.testQueries();

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        dbManager.log('error', 'Session check failed', sessionError);
      }

      if (session?.user) {
        dbManager.log('info', 'Found existing session, loading user data...');
        await get().loadUserData(session.user);
      } else {
        dbManager.log('info', 'No session found, loading demo user...');
        await get().loadDemoUser();
      }

      set({ loading: false });
      dbManager.log('info', '✅ Auth store initialization completed');
    } catch (error) {
      dbManager.log('error', 'Auth initialization failed', error);
      set({ error: error.message });
      // Load demo user as fallback
      await get().loadDemoUser();
      set({ loading: false });
    }
  },

  loadUserData: async (authUser) => {
    try {
      dbManager.log('info', `Loading user data for: ${authUser.email}`);

      // Get user from live database
      const { data: user, error } = await supabase
        .from('sp_users_live')
        .select(`
          *,
          organization:sp_organizations_live(*),
          clinic:sp_clinics_live(*)
        `)
        .eq('email', authUser.email)
        .single();

      if (error) {
        dbManager.log('error', 'User not found in live database', error);
        dbManager.log('info', 'Falling back to demo user...');
        await get().loadDemoUser();
        return;
      }

      dbManager.log('info', '✅ User found in database', {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      });

      // Get user's accessible clinics
      const { data: clinics, error: clinicsError } = await supabase
        .from('sp_clinics_live')
        .select('*')
        .eq('organization_id', user.organization_id);

      if (clinicsError) {
        dbManager.log('error', 'Failed to load clinics', clinicsError);
      } else {
        dbManager.log('info', `✅ Loaded ${clinics.length} clinics for user`);
      }

      set({
        user,
        organization: user.organization,
        clinics: clinics || [],
        selectedClinic: user.clinic || clinics?.[0] || null,
        error: null
      });
    } catch (error) {
      dbManager.log('error', 'Error in loadUserData', error);
      set({ error: error.message });
      await get().loadDemoUser();
    }
  },

  loadDemoUser: async () => {
    try {
      dbManager.log('info', 'Loading demo user...');

      // Get organization
      const organization = await dbManager.getOrganization();
      if (!organization) {
        throw new Error('Failed to get/create organization');
      }

      dbManager.log('info', '✅ Organization loaded', {
        id: organization.id,
        name: organization.name
      });

      // Get first user (admin) for demo
      const { data: user, error } = await supabase
        .from('sp_users_live')
        .select(`
          *,
          clinic:sp_clinics_live(*)
        `)
        .eq('role', 'agency_admin')
        .limit(1)
        .single();

      if (error || !user) {
        dbManager.log('warn', 'No admin user found, creating demo user...', error);
        
        // Create demo user if none exists
        const { data: newUser, error: createError } = await supabase
          .from('sp_users_live')
          .insert({
            organization_id: organization.id,
            email: 'demo@smartpaws.com',
            first_name: 'Demo',
            last_name: 'Admin',
            role: 'agency_admin'
          })
          .select()
          .single();

        if (createError) {
          dbManager.log('error', 'Failed to create demo user', createError);
          throw createError;
        }

        dbManager.log('info', '✅ Demo user created', {
          id: newUser.id,
          email: newUser.email
        });

        set({
          user: newUser,
          organization: organization,
          clinics: [],
          selectedClinic: null,
          error: null
        });
        return;
      }

      dbManager.log('info', '✅ Demo user found', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Get all clinics for the organization
      const { data: clinics, error: clinicsError } = await supabase
        .from('sp_clinics_live')
        .select('*')
        .eq('organization_id', organization.id);

      if (clinicsError) {
        dbManager.log('error', 'Failed to load clinics for demo user', clinicsError);
      } else {
        dbManager.log('info', `✅ Loaded ${clinics.length} clinics for demo user`);
      }

      set({
        user: { ...user, organization },
        organization,
        clinics: clinics || [],
        selectedClinic: user.clinic || clinics?.[0] || null,
        error: null
      });
    } catch (error) {
      dbManager.log('error', 'Error in loadDemoUser', error);
      set({ error: error.message });
      
      // Ultimate fallback to basic demo user
      dbManager.log('warn', 'Using basic fallback demo user...');
      set({
        user: {
          id: 'demo-user',
          email: 'demo@smartpaws.com',
          first_name: 'Demo',
          last_name: 'Admin',
          role: 'agency_admin'
        },
        organization: {
          id: 'demo-org',
          name: 'Demo Organization'
        },
        clinics: [],
        selectedClinic: null,
        error: null
      });
    }
  },

  signIn: async (email, password) => {
    try {
      dbManager.log('info', `Attempting sign in for: ${email}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dbManager.log('error', 'Sign in failed', error);
        throw error;
      }

      dbManager.log('info', '✅ Sign in successful');

      if (data.user) {
        await get().loadUserData(data.user);
      }

      return data;
    } catch (error) {
      dbManager.log('error', 'Sign in error', error);
      set({ error: error.message });
      throw error;
    }
  },

  signUp: async (email, password, userData) => {
    try {
      dbManager.log('info', `Attempting sign up for: ${email}`);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        dbManager.log('error', 'Sign up failed', error);
        throw error;
      }

      dbManager.log('info', '✅ Sign up successful');

      if (data.user) {
        // Create user profile in live database
        const organization = await dbManager.getOrganization();

        const { data: newUser, error: profileError } = await supabase
          .from('sp_users_live')
          .insert({
            organization_id: organization?.id,
            email: data.user.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'clinic_user'
          })
          .select()
          .single();

        if (profileError) {
          dbManager.log('error', 'Failed to create user profile', profileError);
          throw profileError;
        }

        dbManager.log('info', '✅ User profile created', { id: newUser.id });

        await get().loadUserData(data.user);
      }

      return data;
    } catch (error) {
      dbManager.log('error', 'Sign up error', error);
      set({ error: error.message });
      throw error;
    }
  },

  signOut: async () => {
    try {
      dbManager.log('info', 'Signing out...');
      await supabase.auth.signOut();
      
      set({
        user: null,
        clinics: [],
        selectedClinic: null,
        organization: null,
        error: null
      });
      
      dbManager.log('info', '✅ Sign out successful');
    } catch (error) {
      dbManager.log('error', 'Sign out error', error);
      set({ error: error.message });
    }
  },

  selectClinic: (clinic) => {
    dbManager.log('info', `Selecting clinic: ${clinic.name}`);
    set({ selectedClinic: clinic });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    try {
      dbManager.log('info', `Updating profile for user: ${user.id}`);

      const { data, error } = await supabase
        .from('sp_users_live')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        dbManager.log('error', 'Profile update failed', error);
        throw error;
      }

      dbManager.log('info', '✅ Profile updated successfully');
      set({ user: { ...user, ...data }, error: null });
      return data;
    } catch (error) {
      dbManager.log('error', 'Update profile error', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Set external user for integration mode
  setExternalUser: (externalUser) => {
    dbManager.log('info', 'Setting external user', { email: externalUser.email });
    set({
      user: {
        id: externalUser.id,
        email: externalUser.email,
        first_name: externalUser.firstName || externalUser.first_name,
        last_name: externalUser.lastName || externalUser.last_name,
        role: externalUser.role,
        auth_id: externalUser.auth_id
      },
      loading: false,
      error: null
    });
  },

  // Force reinitialize (useful after impersonation)
  reinitialize: async () => {
    set({ loading: true });
    await get().initialize();
  },

  // Clear any errors
  clearError: () => {
    set({ error: null });
  }
}));

// Initialize auth on store creation
useAuthStore.getState().initialize();