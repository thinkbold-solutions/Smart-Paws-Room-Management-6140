import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiClock, FiUser, FiActivity, FiRefreshCw } = FiIcons;

const RoomBoard = () => {
  const { selectedClinic } = useAuthStore();
  const { rooms, loading, fetchRooms, updateRoomStatus } = useRoomStore();

  useEffect(() => {
    if (selectedClinic) {
      fetchRooms(selectedClinic.id);
    }
  }, [selectedClinic]);

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500 text-white',
      occupied: 'bg-blue-500 text-white',
      cleaning: 'bg-yellow-500 text-white',
      maintenance: 'bg-red-500 text-white',
      reserved: 'bg-purple-500 text-white'
    };
    return colors[status] || colors.available;
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await updateRoomStatus(roomId, newStatus);
      toast.success('Room status updated');
    } catch (error) {
      toast.error('Failed to update room status');
    }
  };

  const getOccupancyInfo = (room) => {
    const assignments = room.room_assignments || [];
    const activeAssignment = assignments.find(a => !a.unassigned_at);
    
    if (activeAssignment) {
      return {
        staff: activeAssignment.staff,
        appointment: activeAssignment.appointments,
        duration: activeAssignment.assigned_at ? 
          Math.floor((new Date() - new Date(activeAssignment.assigned_at)) / (1000 * 60)) : 0
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SafeIcon icon={FiRefreshCw} className="animate-spin text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Board</h1>
          <p className="text-gray-600 mt-1">
            Real-time view of all clinic rooms
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fetchRooms(selectedClinic.id)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiRefreshCw} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Room Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { status: 'available', label: 'Available', count: rooms.filter(r => r.status === 'available').length },
          { status: 'occupied', label: 'Occupied', count: rooms.filter(r => r.status === 'occupied').length },
          { status: 'cleaning', label: 'Cleaning', count: rooms.filter(r => r.status === 'cleaning').length },
          { status: 'maintenance', label: 'Maintenance', count: rooms.filter(r => r.status === 'maintenance').length },
          { status: 'reserved', label: 'Reserved', count: rooms.filter(r => r.status === 'reserved').length }
        ].map((stat) => (
          <div key={stat.status} className={`p-4 rounded-lg ${getStatusColor(stat.status)}`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room, index) => {
          const occupancyInfo = getOccupancyInfo(room);
          
          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Room Header */}
              <div className={`p-4 ${getStatusColor(room.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {room.room_name || `Room ${room.room_number}`}
                    </h3>
                    <p className="text-sm opacity-90 capitalize">{room.room_type}</p>
                  </div>
                  <SafeIcon icon={FiGrid} className="text-xl" />
                </div>
              </div>

              {/* Room Content */}
              <div className="p-4">
                {occupancyInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiUser} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {occupancyInfo.staff?.first_name} {occupancyInfo.staff?.last_name}
                      </span>
                    </div>
                    
                    {occupancyInfo.appointment && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">
                          {occupancyInfo.appointment.clients?.first_name} {occupancyInfo.appointment.clients?.last_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Pet: {occupancyInfo.appointment.pets?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Reason: {occupancyInfo.appointment.reason}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiClock} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {occupancyInfo.duration} minutes
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <SafeIcon icon={FiActivity} className="text-3xl text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Room is {room.status}</p>
                  </div>
                )}

                {/* Quick Status Change */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiGrid} className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
          <p className="text-gray-600">Contact your administrator to set up rooms.</p>
        </div>
      )}
    </div>
  );
};

export default RoomBoard;