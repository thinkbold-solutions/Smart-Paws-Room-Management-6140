import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useLoginAsUserStore } from '../../../stores/loginAsUserStore';
import { dbManager } from '../../../lib/database';
import supabase from '../../../lib/supabase';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiLogIn, FiEye, FiAlertTriangle, FiRefreshCw, FiDatabase, FiActivity } = FiIcons;

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, organization, error: authError } = useAuthStore();
  const { loginAsUser, isImpersonating, logAction } = useLoginAsUserStore();
  const [showLoginAsModal, setShowLoginAsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Enhanced fetch users with comprehensive error handling
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      dbManager.log('info', '📊 Starting user fetch...', { organizationId: organization?.id });

      if (!organization?.id) {
        throw new Error('No organization ID available');
      }

      // Test basic query first
      dbManager.log('debug', 'Testing basic organizations query...');
      const { data: orgTest, error: orgTestError } = await supabase
        .from('sp_organizations_live')
        .select('id, name')
        .eq('id', organization.id)
        .single();

      if (orgTestError) {
        dbManager.log('error', 'Organization test query failed', orgTestError);
        throw new Error(`Organization query failed: ${orgTestError.message}`);
      }

      dbManager.log('info', '✅ Organization test passed', orgTest);

      // Test users table exists and is accessible
      dbManager.log('debug', 'Testing users table access...');
      const { data: usersTest, error: usersTestError } = await supabase
        .from('sp_users_live')
        .select('id')
        .limit(1);

      if (usersTestError) {
        dbManager.log('error', 'Users table test failed', usersTestError);
        throw new Error(`Users table access failed: ${usersTestError.message}`);
      }

      dbManager.log('info', '✅ Users table access confirmed');

      // Main users query
      dbManager.log('debug', 'Executing main users query...');
      const { data, error } = await supabase
        .from('sp_users_live')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          status,
          last_login,
          organization_id,
          clinic_id,
          created_at,
          clinic:sp_clinics_live(
            id,
            name
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        dbManager.log('error', 'Users query failed', error);
        throw new Error(`Users query failed: ${error.message} (Code: ${error.code})`);
      }

      dbManager.log('info', `✅ Users query successful: ${data.length} users found`);

      // Transform data to match expected format
      const transformedUsers = data.map(user => ({
        id: user.id,
        firstName: user.first_name || 'Unknown',
        lastName: user.last_name || 'User',
        email: user.email,
        phone: user.phone || '(555) 000-0000',
        role: user.role,
        clinics: user.clinic ? [user.clinic.name] : ['No clinic assigned'],
        status: user.status || 'active',
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
        organizationId: user.organization_id
      }));

      setUsers(transformedUsers);
      setDebugInfo({
        organizationId: organization.id,
        organizationName: organization.name,
        usersCount: transformedUsers.length,
        rawData: data,
        querySuccess: true,
        timestamp: new Date().toISOString()
      });

      dbManager.log('info', `🎉 User fetch completed successfully: ${transformedUsers.length} users`);

    } catch (error) {
      dbManager.log('error', 'User fetch failed', error);
      setDebugInfo({
        organizationId: organization?.id,
        organizationName: organization?.name,
        error: error.message,
        querySuccess: false,
        timestamp: new Date().toISOString()
      });

      toast.error(`Failed to load users: ${error.message}`);

      // Set mock users for development
      const mockUsers = [
        {
          id: 'mock-1',
          firstName: 'Demo',
          lastName: 'Admin',
          email: 'admin@smartpaws.demo',
          phone: '(555) 000-0001',
          role: 'agency_admin',
          clinics: ['Demo Clinic'],
          status: 'active',
          lastLogin: 'Just now',
          organizationId: organization?.id || 'demo-org'
        },
        {
          id: 'mock-2',
          firstName: 'Test',
          lastName: 'User',
          email: 'user@smartpaws.demo',
          phone: '(555) 000-0002',
          role: 'clinic_user',
          clinics: ['Demo Clinic'],
          status: 'active',
          lastLogin: '1 hour ago',
          organizationId: organization?.id || 'demo-org'
        }
      ];

      setUsers(mockUsers);
      dbManager.log('warn', 'Using mock users as fallback');

    } finally {
      setFetchingUsers(false);
    }
  };

  // Debug database state
  const runDatabaseDebug = async () => {
    setShowDebug(true);
    await dbManager.debugDatabaseState();
    toast.success('Database debug completed - check console for details');
  };

  useEffect(() => {
    if (organization?.id) {
      fetchUsers();
    } else {
      dbManager.log('warn', 'No organization available for user fetch');
      setFetchingUsers(false);
    }
  }, [organization?.id]);

  // Set up real-time subscription for users with error handling
  useEffect(() => {
    if (!organization?.id) return;

    dbManager.log('info', 'Setting up real-time subscription for users...');
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sp_users_live',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        dbManager.log('info', 'Real-time user update received', payload);
        fetchUsers(); // Refresh users on any change
        toast.success('User data updated in real-time!');
      })
      .subscribe();

    return () => {
      dbManager.log('debug', 'Cleaning up user subscription');
      supabase.removeChannel(subscription);
    };
  }, [organization?.id]);

  const getRoleColor = (role) => {
    const colors = {
      'agency_admin': 'bg-purple-100 text-purple-800',
      'agency_user': 'bg-blue-100 text-blue-800',
      'clinic_admin': 'bg-green-100 text-green-800',
      'clinic_user': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.clinic_user;
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'agency_admin': 'Agency Admin',
      'agency_user': 'Agency User',
      'clinic_admin': 'Clinic Admin',
      'clinic_user': 'Clinic User'
    };
    return roleMap[role] || role;
  };

  const canLoginAsUser = (user) => {
    if (currentUser?.role !== 'agency_admin') return false;
    if (user.id === currentUser?.id) return false;
    if (user.role === 'agency_admin') return false;
    if (user.status !== 'active') return false;
    return true;
  };

  const handleLoginAsUser = async () => {
    if (!selectedUser || confirmationText !== selectedUser.email) {
      toast.error('Please confirm by typing the user\'s email address');
      return;
    }

    setLoading(true);
    try {
      dbManager.log('info', 'Starting user impersonation process...');

      await loginAsUser({
        originalAdmin: {
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          role: currentUser.role
        },
        targetUser: {
          id: selectedUser.id,
          email: selectedUser.email,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          role: selectedUser.role
        },
        timestamp: new Date().toISOString(),
        reason: 'Customer support assistance'
      });

      await logAction({
        type: 'LOGIN_AS_USER',
        details: `Admin ${currentUser.email} logged in as ${selectedUser.email}`,
        data: {
          targetUserId: selectedUser.id,
          targetUserRole: selectedUser.role,
          reason: 'Customer support assistance'
        }
      });

      const targetRoute = getDashboardRoute(selectedUser.role);

      toast.success(
        `Successfully logged in as ${selectedUser.firstName} ${selectedUser.lastName}`,
        { duration: 6000, icon: '🔐' }
      );

      setShowLoginAsModal(false);
      setSelectedUser(null);
      setConfirmationText('');

      setTimeout(() => {
        navigate(targetRoute);
      }, 1000);

    } catch (error) {
      dbManager.log('error', 'Login as user failed', error);
      toast.error('Failed to login as user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'clinic_admin': return '/clinic-admin';
      case 'clinic_user': return '/clinic';
      case 'agency_user': return '/agency';
      default: return '/agency';
    }
  };

  const LoginAsModal = () => (
    <AnimatePresence>
      {showLoginAsModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiAlertTriangle} className="text-orange-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Login as User</h3>
                <p className="text-sm text-gray-600">This action will be logged for audit purposes</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUser} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Role:</span>
                  <p className="font-medium">{getRoleDisplayName(selectedUser.role)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-medium capitalize">{selectedUser.status}</p>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Clinic Access:</span>
                <p className="font-medium">{selectedUser.clinics.join(', ')}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm by typing the user's email address:
              </label>
              <input
                type="email"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={selectedUser.email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiAlertTriangle} className="text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important Security Notice:</p>
                  <ul className="text-yellow-700 mt-1 space-y-1">
                    <li>• This session will be logged and audited</li>
                    <li>• You'll have full access to this user's account</li>
                    <li>• Use only for legitimate customer support</li>
                    <li>• You can return to your admin account anytime</li>
                    <li>• All actions performed will be tracked</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowLoginAsModal(false);
                  setSelectedUser(null);
                  setConfirmationText('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                onClick={handleLoginAsUser}
                disabled={confirmationText !== selectedUser.email || loading}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading && <SafeIcon icon={FiRefreshCw} className="animate-spin" />}
                <span>{loading ? 'Logging in...' : 'Login as User'}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (fetchingUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-primary-600 mb-4" />
        <span className="text-lg text-gray-700">Loading users...</span>
        <span className="text-sm text-gray-500 mt-2">Connecting to database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users across all clinics in your network • Live Data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runDatabaseDebug}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiDatabase} />
            <span>Debug DB</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchUsers}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiRefreshCw} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add User</span>
          </motion.button>
        </div>
      </div>

      {/* Error Display */}
      {(authError || debugInfo?.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-xl mt-1" />
            <div>
              <h3 className="font-semibold text-red-900">Database Connection Issue</h3>
              <p className="text-red-800 text-sm mt-1">
                {authError || debugInfo?.error}
              </p>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-red-700 underline text-sm mt-2"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {showDebug && debugInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Debug Information</h3>
          <pre className="text-xs text-gray-700 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Live Data Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <SafeIcon icon={FiActivity} className="text-green-600" />
          <span className="text-sm text-green-800 font-medium">Live Data Connected</span>
          <span className="text-xs text-green-600">• Real-time updates enabled</span>
          {debugInfo?.querySuccess && (
            <span className="text-xs text-green-600">
              • Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Login as User Feature Callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <SafeIcon icon={FiLogIn} className="text-white text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">🔐 Login as User Feature</h3>
            <p className="text-sm text-gray-600">
              Click the <span className="font-semibold text-orange-600">orange login icon (🔗)</span> in the Actions column to securely impersonate any user for customer support.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Show impersonation notice */}
      {isImpersonating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiEye} className="text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  You are currently viewing as another user
                </p>
                <p className="text-sm text-orange-700">
                  This session is being logged for audit purposes
                </p>
              </div>
            </div>
            <button
              onClick={() => { navigate('/agency'); }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors"
            >
              Return to Admin
            </button>
          </div>
        </motion.div>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Users', value: users.length, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Active Users', value: users.filter(u => u.status === 'active').length, color: 'text-green-600', bg: 'bg-green-100' },
          { title: 'Clinic Admins', value: users.filter(u => u.role === 'clinic_admin').length, color: 'text-purple-600', bg: 'bg-purple-100' },
          { title: 'Clinic Users', value: users.filter(u => u.role === 'clinic_user').length, color: 'text-orange-600', bg: 'bg-orange-100' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <SafeIcon icon={FiUser} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <SafeIcon icon={FiLogIn} className="text-orange-600" />
              <span className="font-medium">🔗 = Login as User</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinics Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiUser} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <SafeIcon icon={FiMail} className="mr-1" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <SafeIcon icon={FiPhone} className="mr-1" />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      <SafeIcon icon={FiShield} className="mr-1" />
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.clinics.slice(0, 2).map((clinic, idx) => (
                        <div key={idx} className="flex items-center">
                          <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                          {clinic}
                        </div>
                      ))}
                      {user.clinics.length > 2 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{user.clinics.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {canLoginAsUser(user) && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowLoginAsModal(true);
                          }}
                          className="text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Login as this user"
                        >
                          <SafeIcon icon={FiLogIn} className="text-lg" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        <SafeIcon icon={FiEdit} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiUser} className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Users will appear here once they're added to your organization.</p>
            {debugInfo?.error && (
              <p className="text-red-600 text-sm mt-2">Database Error: {debugInfo.error}</p>
            )}
          </div>
        )}
      </div>

      <LoginAsModal />
    </div>
  );
};

export default UserManagement;