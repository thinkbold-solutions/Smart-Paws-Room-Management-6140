import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiShield, FiPlus, FiEdit, FiTrash2, FiEye, FiCheck, FiX, FiSettings, FiLock } = FiIcons;

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    // Mock users data
    const mockUsers = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@downtownvet.com',
        role: 'agency_admin',
        status: 'active',
        lastLogin: '2024-01-15 09:30 AM',
        clinics: ['Downtown Vet Clinic', 'Westside Animal Hospital'],
        permissions: ['manage_users', 'view_analytics', 'manage_clinics', 'ai_insights']
      },
      {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@downtownvet.com',
        role: 'clinic_admin',
        status: 'active',
        lastLogin: '2024-01-15 08:45 AM',
        clinics: ['Downtown Vet Clinic'],
        permissions: ['manage_staff', 'view_analytics', 'manage_rooms']
      },
      {
        id: 3,
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike.davis@downtownvet.com',
        role: 'clinic_user',
        status: 'inactive',
        lastLogin: '2024-01-10 02:15 PM',
        clinics: ['Downtown Vet Clinic'],
        permissions: ['view_rooms', 'manage_assignments']
      }
    ];
    setUsers(mockUsers);
  };

  const fetchRoles = async () => {
    // Mock roles data
    const mockRoles = [
      {
        id: 'agency_admin',
        name: 'Agency Administrator',
        description: 'Full access to all agency features and clinics',
        permissions: ['manage_users', 'view_analytics', 'manage_clinics', 'ai_insights', 'system_settings'],
        userCount: 2
      },
      {
        id: 'clinic_admin',
        name: 'Clinic Administrator',
        description: 'Manage clinic operations, staff, and rooms',
        permissions: ['manage_staff', 'view_analytics', 'manage_rooms', 'manage_appointments'],
        userCount: 5
      },
      {
        id: 'clinic_user',
        name: 'Clinic User',
        description: 'Basic clinic operations and room management',
        permissions: ['view_rooms', 'manage_assignments', 'view_schedule'],
        userCount: 12
      }
    ];
    setRoles(mockRoles);
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, permissions: getRolePermissions(newRole) }
          : user
      ));
      
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
      
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (role) => {
    const roleObj = roles.find(r => r.id === role);
    return roleObj ? roleObj.permissions : [];
  };

  const getRoleColor = (role) => {
    const colors = {
      'agency_admin': 'bg-purple-100 text-purple-800',
      'clinic_admin': 'bg-blue-100 text-blue-800',
      'clinic_user': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const RoleModal = () => (
    <AnimatePresence>
      {showRoleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Change User Role
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            {selectedUser && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-600">
                    Current Role: <span className="font-medium">{selectedUser.role}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select New Role
                  </label>
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        handleRoleChange(selectedUser.id, role.id);
                        setShowRoleModal(false);
                      }}
                    >
                      <SafeIcon icon={FiShield} className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{role.name}</p>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {permission.replace('_', ' ')}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const PermissionModal = () => (
    <AnimatePresence>
      {showPermissionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                User Permissions
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            {selectedUser && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Permissions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.permissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <SafeIcon icon={FiCheck} className="text-green-600" />
                        <span className="text-sm text-green-800">
                          {permission.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Clinic Access</h4>
                  <div className="space-y-2">
                    {selectedUser.clinics.map((clinic) => (
                      <div
                        key={clinic}
                        className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <SafeIcon icon={FiCheck} className="text-blue-600" />
                        <span className="text-sm text-blue-800">{clinic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user roles, permissions, and access levels
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add User</span>
        </motion.button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiShield} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.userCount} users</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 3).map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {permission.replace('_', ' ')}
                </span>
              ))}
              {role.permissions.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{role.permissions.length - 3} more
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Users ({filteredUsers.length})
          </h3>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic Access
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
              {filteredUsers.map((user, index) => (
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
                        <SafeIcon icon={FiUsers} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      <SafeIcon icon={FiShield} className="mr-1" />
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(user.id)}
                      disabled={loading}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${getStatusColor(user.status)} hover:opacity-80 disabled:opacity-50`}
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.clinics.slice(0, 2).map((clinic, idx) => (
                        <div key={idx} className="truncate">
                          {clinic}
                        </div>
                      ))}
                      {user.clinics.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{user.clinics.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Permissions"
                      >
                        <SafeIcon icon={FiEye} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Change Role"
                      >
                        <SafeIcon icon={FiEdit} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-red-600 hover:text-red-900"
                        title="Remove User"
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
      </div>

      {/* Modals */}
      <RoleModal />
      <PermissionModal />
    </div>
  );
};

export default UserRoleManagement;