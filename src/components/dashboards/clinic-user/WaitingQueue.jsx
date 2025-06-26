import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiClock, FiArrowRight, FiPlus, FiActivity } = FiIcons;

const WaitingQueue = () => {
  const { user, selectedClinic } = useAuthStore();
  const { waitingClients, rooms, fetchWaitingClients, fetchRooms, moveClientToRoom } = useRoomStore();

  useEffect(() => {
    if (selectedClinic) {
      fetchWaitingClients(selectedClinic.id);
      fetchRooms(selectedClinic.id);
    }
  }, [selectedClinic]);

  const handleMoveToRoom = async (clientId, roomId) => {
    try {
      await moveClientToRoom(clientId, roomId, user.id);
      toast.success('Client moved to room successfully');
    } catch (error) {
      toast.error('Failed to move client to room');
    }
  };

  const availableRooms = rooms.filter(room => room.status === 'available');

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.normal;
  };

  const getWaitTime = (checkInTime) => {
    return Math.floor((new Date() - new Date(checkInTime)) / (1000 * 60));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waiting Queue</h1>
          <p className="text-gray-600 mt-1">
            Manage clients waiting for appointments
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Check In Client</span>
        </motion.button>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Waiting Clients', 
            value: waitingClients.length, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100' 
          },
          { 
            title: 'Available Rooms', 
            value: availableRooms.length, 
            color: 'text-green-600', 
            bg: 'bg-green-100' 
          },
          { 
            title: 'Avg Wait Time', 
            value: waitingClients.length > 0 
              ? `${Math.round(waitingClients.reduce((sum, client) => sum + getWaitTime(client.check_in_time), 0) / waitingClients.length)} min`
              : '0 min',
            color: 'text-orange-600', 
            bg: 'bg-orange-100' 
          },
          { 
            title: 'Longest Wait', 
            value: waitingClients.length > 0 
              ? `${Math.max(...waitingClients.map(client => getWaitTime(client.check_in_time)))} min`
              : '0 min',
            color: 'text-red-600', 
            bg: 'bg-red-100' 
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
                <SafeIcon icon={FiUsers} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Waiting Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Queue</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {waitingClients.length > 0 ? (
            waitingClients.map((client, index) => {
              const waitTime = getWaitTime(client.check_in_time);
              
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {client.clients?.first_name} {client.clients?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Pet: {client.pets?.name} | Reason: {client.reason}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
                            {client.priority}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <SafeIcon icon={FiClock} className="mr-1" />
                            Waiting {waitTime} minutes
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {availableRooms.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleMoveToRoom(client.id, e.target.value);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="">Select Room</option>
                            {availableRooms.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.room_name || `Room ${room.room_number}`}
                              </option>
                            ))}
                          </select>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
                          >
                            <SafeIcon icon={FiArrowRight} />
                          </motion.button>
                        </div>
                      )}
                      
                      {availableRooms.length === 0 && (
                        <span className="text-sm text-gray-500">No rooms available</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <SafeIcon icon={FiUsers} className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients waiting</h3>
              <p className="text-gray-600">The waiting queue is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingQueue;