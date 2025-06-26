import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiUser, FiMail, FiPhone, FiClock, FiActivity } = FiIcons;

const StaffManagement = () => {
  const [staff, setStaff] = useState([
    {
      id: 1,
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@clinic.com',
      phone: '(555) 123-4567',
      role: 'Veterinarian',
      department: 'Surgery',
      status: 'active',
      currentRoom: 'Room 2',
      hoursThisWeek: 38,
      efficiency: 94
    },
    {
      id: 2,
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@clinic.com',
      phone: '(555) 987-6543',
      role: 'Vet Tech',
      department: 'General',
      status: 'active',
      currentRoom: null,
      hoursThisWeek: 40,
      efficiency: 87
    },
    {
      id: 3,
      firstName: 'Lisa',
      lastName: 'Chen',
      email: 'lisa.chen@clinic.com',
      phone: '(555) 456-7890',
      role: 'Receptionist',
      department: 'Front Desk',
      status: 'break',
      currentRoom: null,
      hoursThisWeek: 35,
      efficiency: 92
    }
  ]);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      break: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-800',
      busy: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.offline;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor clinic staff assignments and performance
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Staff</span>
        </motion.button>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Staff', value: staff.length, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Active Now', value: staff.filter(s => s.status === 'active').length, color: 'text-green-600', bg: 'bg-green-100' },
          { title: 'On Break', value: staff.filter(s => s.status === 'break').length, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { title: 'Avg Efficiency', value: `${Math.round(staff.reduce((sum, s) => sum + s.efficiency, 0) / staff.length)}%`, color: 'text-purple-600', bg: 'bg-purple-100' }
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUser} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiEdit} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiTrash2} />
                </motion.button>
              </div>
            </div>

            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiMail} className="mr-2" />
                {member.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiPhone} className="mr-2" />
                {member.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiActivity} className="mr-2" />
                Department: {member.department}
              </div>
              {member.currentRoom && (
                <div className="flex items-center text-sm text-gray-600">
                  <SafeIcon icon={FiClock} className="mr-2" />
                  Currently in: {member.currentRoom}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{member.hoursThisWeek}h</p>
                  <p className="text-sm text-gray-600">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{member.efficiency}%</p>
                  <p className="text-sm text-gray-600">Efficiency</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;