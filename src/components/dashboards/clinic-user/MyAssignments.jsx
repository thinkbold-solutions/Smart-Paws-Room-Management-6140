import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiClock, FiGrid, FiActivity, FiCalendar } = FiIcons;

const MyAssignments = () => {
  const { user, selectedClinic } = useAuthStore();
  const { rooms, appointments, fetchRooms, fetchAppointments } = useRoomStore();

  useEffect(() => {
    if (selectedClinic) {
      fetchRooms(selectedClinic.id);
      fetchAppointments(selectedClinic.id);
    }
  }, [selectedClinic]);

  // Filter rooms assigned to current user
  const myAssignedRooms = rooms.filter(room => 
    room.room_assignments?.some(assignment => 
      assignment.staff_id === user?.id && !assignment.unassigned_at
    )
  );

  // Filter appointments assigned to current user
  const myAppointments = appointments.filter(appointment => 
    appointment.staff_id === user?.id
  );

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-red-100 text-red-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.available;
  };

  const getAssignmentDuration = (assignment) => {
    if (!assignment.assigned_at) return 0;
    return Math.floor((new Date() - new Date(assignment.assigned_at)) / (1000 * 60));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">
            Your current room assignments and appointments
          </p>
        </div>
      </div>

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Active Rooms', 
            value: myAssignedRooms.length, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100',
            icon: FiGrid
          },
          { 
            title: 'Today\'s Appointments', 
            value: myAppointments.length, 
            color: 'text-green-600', 
            bg: 'bg-green-100',
            icon: FiCalendar
          },
          { 
            title: 'In Progress', 
            value: myAppointments.filter(a => a.status === 'in_progress').length, 
            color: 'text-orange-600', 
            bg: 'bg-orange-100',
            icon: FiActivity
          },
          { 
            title: 'Completed', 
            value: myAppointments.filter(a => a.status === 'completed').length, 
            color: 'text-purple-600', 
            bg: 'bg-purple-100',
            icon: FiUser
          }
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
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current Room Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Room Assignments</h3>
        
        {myAssignedRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssignedRooms.map((room, index) => {
              const assignment = room.room_assignments?.find(a => 
                a.staff_id === user?.id && !a.unassigned_at
              );
              const duration = assignment ? getAssignmentDuration(assignment) : 0;
              
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {room.room_name || `Room ${room.room_number}`}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </div>
                  
                  {assignment?.appointments && (
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="font-medium text-gray-900">
                        {assignment.appointments.clients?.first_name} {assignment.appointments.clients?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pet: {assignment.appointments.pets?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reason: {assignment.appointments.reason}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <SafeIcon icon={FiClock} className="mr-1" />
                      {duration} minutes
                    </div>
                    <span className="text-xs text-gray-500">
                      Started: {new Date(assignment.assigned_at).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <SafeIcon icon={FiGrid} className="text-4xl text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Current Room Assignments</h4>
            <p className="text-gray-600">You don't have any active room assignments right now.</p>
          </div>
        )}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Appointments</h3>
        
        {myAppointments.length > 0 ? (
          <div className="space-y-4">
            {myAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                    <SafeIcon icon={FiUser} className="text-white" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {appointment.clients?.first_name} {appointment.clients?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Pet: {appointment.pets?.name} | {appointment.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.rooms ? `Room: ${appointment.rooms.room_name || `Room ${appointment.rooms.room_number}`}` : 'No room assigned'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(appointment.appointment_time).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <SafeIcon icon={FiCalendar} className="text-4xl text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Appointments Today</h4>
            <p className="text-gray-600">You don't have any appointments scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;