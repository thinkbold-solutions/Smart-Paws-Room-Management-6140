import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiEye, FiMapPin, FiPhone, FiMail, FiUsers, FiActivity } = FiIcons;

const ClinicManagement = () => {
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Mock clinic data
  const [clinics, setClinics] = useState([
    {
      id: 1,
      name: 'Downtown Vet Clinic',
      address: '123 Main St, Downtown',
      phone: '(555) 123-4567',
      email: 'info@downtownvet.com',
      status: 'active',
      staff: 12,
      rooms: 6,
      activeRooms: 4,
      monthlyRevenue: 12400,
      efficiency: 94
    },
    {
      id: 2,
      name: 'Westside Animal Hospital',
      address: '456 Oak Ave, Westside',
      phone: '(555) 987-6543',
      email: 'contact@westsideanimal.com',
      status: 'active',
      staff: 18,
      rooms: 8,
      activeRooms: 6,
      monthlyRevenue: 15600,
      efficiency: 91
    },
    {
      id: 3,
      name: 'Pet Care Plus',
      address: '789 Pine Rd, Midtown',
      phone: '(555) 456-7890',
      email: 'hello@petcareplus.com',
      status: 'active',
      staff: 8,
      rooms: 4,
      activeRooms: 3,
      monthlyRevenue: 8900,
      efficiency: 89
    }
  ]);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all clinics in your network
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Clinic</span>
        </motion.button>
      </div>

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {clinics.map((clinic, index) => (
          <motion.div
            key={clinic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(clinic.status)}`}>
                  {clinic.status.charAt(0).toUpperCase() + clinic.status.slice(1)}
                </span>
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiEye} />
                </motion.button>
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

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiMapPin} className="mr-2" />
                {clinic.address}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiPhone} className="mr-2" />
                {clinic.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <SafeIcon icon={FiMail} className="mr-2" />
                {clinic.email}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <SafeIcon icon={FiUsers} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">Staff</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{clinic.staff}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <SafeIcon icon={FiActivity} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">Rooms</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {clinic.activeRooms}/{clinic.rooms}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Efficiency</span>
                  <span className="font-medium text-gray-900">{clinic.efficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clinic.efficiency}%` }}
                    transition={{ delay: index * 0.2, duration: 1 }}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-gray-900">
                  ${clinic.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{clinics.length}</p>
            <p className="text-sm text-gray-600">Total Clinics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {clinics.reduce((sum, clinic) => sum + clinic.staff, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Staff</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {clinics.reduce((sum, clinic) => sum + clinic.rooms, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Rooms</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${clinics.reduce((sum, clinic) => sum + clinic.monthlyRevenue, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicManagement;