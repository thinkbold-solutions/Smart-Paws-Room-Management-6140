import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiUsers, FiClock, FiActivity, FiUser } = FiIcons;

const UserOverview = () => {
  const { user, selectedClinic } = useAuthStore();
  const { rooms, appointments, waitingClients, fetchRooms, fetchAppointments, fetchWaitingClients } = useRoomStore();

  useEffect(() => {
    if (selectedClinic) {
      fetchRooms(selectedClinic.id);
      fetchAppointments(selectedClinic.id);
      fetchWaitingClients(selectedClinic.id);
    }
  }, [selectedClinic]);

  const myAssignments = rooms.filter(room => 
    room.room_assignments?.some(assignment => 
      assignment.staff_id === user?.id && !assignment.unassigned_at
    )
  );

  const quickStats = [
    {
      title: 'My Assigned Rooms',
      value: myAssignments.length,
      icon: FiGrid,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Total Rooms',
      value: rooms.length,
      icon: FiActivity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Waiting Clients',
      value: waitingClients.length,
      icon: FiUsers,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      title: 'Today\'s Schedule',
      value: appointments.length,
      icon: FiClock,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.available;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your dashboard for {selectedClinic?.name}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Assignments and Room Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Room Assignments</h3>
          <div className="space-y-3">
            {myAssignments.length > 0 ? (
              myAssignments.map((room) => {
                const assignment = room.room_assignments?.find(a => 
                  a.staff_id === user?.id && !a.unassigned_at
                );
                const duration = assignment ? 
                  Math.floor((new Date() - new Date(assignment.assigned_at)) / (1000 * 60)) : 0;

                return (
                  <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {room.room_name || `Room ${room.room_number}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {assignment?.appointments?.clients?.first_name} {assignment?.appointments?.clients?.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{duration} min</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SafeIcon icon={FiUser} className="text-3xl mx-auto mb-2" />
                <p>No current room assignments</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Room Status</h3>
          <div className="space-y-3">
            {rooms.slice(0, 6).map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {room.room_name || `Room ${room.room_number}`}
                  </p>
                  <p className="text-sm text-gray-600">{room.room_type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Room Board', icon: FiGrid, href: '/clinic/rooms' },
            { name: 'Waiting Queue', icon: FiUsers, href: '/clinic/waiting' },
            { name: 'My Schedule', icon: FiClock, href: '/clinic/schedule' },
            { name: 'Active Timers', icon: FiActivity, href: '/clinic/timers' }
          ].map((action) => (
            <motion.button
              key={action.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200 hover:border-primary-300 transition-colors"
            >
              <SafeIcon icon={action.icon} className="text-2xl text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">{action.name}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UserOverview;