import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QuestProvider } from '@questlabs/react-sdk';
import '@questlabs/react-sdk/dist/style.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Config
import questConfig from './config/questConfig';

// Auth Components
import QuestLogin from './components/auth/QuestLogin';
import QuestOnboarding from './components/auth/QuestOnboarding';
import GHLCallback from './components/auth/GHLCallback';

// Setup Components
import SupabaseSetupGuide from './components/setup/SupabaseSetupGuide';

// Dashboard Components
import AgencyDashboard from './components/dashboards/AgencyDashboard';
import ClinicAdminDashboard from './components/dashboards/ClinicAdminDashboard';
import ClinicUserDashboard from './components/dashboards/ClinicUserDashboard';

// Layout Components
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ImpersonationBanner from './components/common/ImpersonationBanner';

// Hooks
import { useLoginAsUserStore } from './stores/loginAsUserStore';
import { useAuthStore } from './stores/authStore';

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();
  const { isImpersonating, targetUser } = useLoginAsUserStore();
  const { error } = useAuthStore();

  if (loading) {
    return <LoadingSpinner message="Initializing Smart Paws..." />;
  }

  // Show setup guide if Supabase is not configured
  if (error && error.includes('Please configure Supabase credentials')) {
    return <SupabaseSetupGuide />;
  }

  const getDashboardRoute = () => {
    if (!isAuthenticated || !user) return '/login';

    // If impersonating, use target user's role
    const activeUser = isImpersonating && targetUser ? targetUser : user;

    switch (activeUser.role) {
      case 'agency_admin':
      case 'agency_user':
        return '/agency';
      case 'clinic_admin':
        return '/clinic-admin';
      case 'clinic_user':
        return '/clinic';
      default:
        return '/agency'; // Default to agency dashboard
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner - shows when admin is logged in as another user */}
      {isImpersonating && <ImpersonationBanner />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute()} replace />
            ) : (
              <QuestLogin />
            )
          }
        />
        
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <QuestOnboarding />
            </ProtectedRoute>
          }
        />

        {/* GHL OAuth Callback Route */}
        <Route
          path="/agency/ghl-callback"
          element={
            <ProtectedRoute allowedRoles={['agency_admin']}>
              <GHLCallback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agency/*"
          element={
            <ProtectedRoute allowedRoles={['agency_admin', 'agency_user']}>
              <AgencyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clinic-admin/*"
          element={
            <ProtectedRoute allowedRoles={['clinic_admin']}>
              <ClinicAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clinic/*"
          element={
            <ProtectedRoute allowedRoles={['clinic_user']}>
              <ClinicUserDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QuestProvider
      apiKey={questConfig.APIKEY}
      entityId={questConfig.ENTITYID}
      apiType="PRODUCTION"
    >
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QuestProvider>
  );
}

export default App;