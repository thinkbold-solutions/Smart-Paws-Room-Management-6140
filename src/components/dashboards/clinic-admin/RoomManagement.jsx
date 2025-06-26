import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiGrid, FiClock, FiUser, FiActivity } = FiIcons;

const RoomManagement = () => {
  const { selectedClinic } = useAuthStore();
  const { rooms, loading, fetchRooms, updateRoomStatus } = useRoomStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (selectedClinic) {
      fetchRooms(selectedClinic.id);
    }
  }, [selectedClinic]);

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-blue-100 text-blue-800 border-blue-200',
      cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      maintenance: 'bg-red-100 text-red-800 border-red-200',
      reserved: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || colors.available;
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await updateRoomStatus(roomId, newStatus);
      toast.success('Room status updated successfully');
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
        <SafeIcon icon={FiActivity} className="animate-spin text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all rooms in your clinic
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Room</span>
        </motion.button>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { status: 'available', label: 'Available', count: rooms.filter(r => r.status === 'available').length },
          { status: 'occupied', label: 'Occupied', count: rooms.filter(r => r.status === 'occupied').length },
          { status: 'cleaning', label: 'Cleaning', count: rooms.filter(r => r.status === 'cleaning').length },
          { status: 'maintenance', label: 'Maintenance', count: rooms.filter(r => r.status === 'maintenance').length },
          { status: 'reserved', label: 'Reserved', count: rooms.filter(r => r.status === 'reserved').length }
        ].map((stat) => (
          <div key={stat.status} className={`p-4 rounded-lg border-2 ${getStatusColor(stat.status)}`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, index) => {
          const occupancyInfo = getOccupancyInfo(room);
          
          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.room_name || `Room ${room.room_number}`}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">{room.room_type}</p>
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
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>

              {occupancyInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiUser} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {occupancyInfo.staff?.first_name} {occupancyInfo.staff?.last_name}
                    </span>
                  </div>
                  {occupancyInfo.appointment && (
                    <div className="text-sm text-gray-600 mb-2">
                      Patient: {occupancyInfo.appointment.clients?.first_name} {occupancyInfo.appointment.clients?.last_name}
                      <br />
                      Pet: {occupancyInfo.appointment.pets?.name}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiClock} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {occupancyInfo.duration} minutes
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Capacity:</strong> {room.capacity || 1} person(s)
                </p>
                {room.equipment && room.equipment.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <strong>Equipment:</strong> {room.equipment.join(', ')}
                  </p>
                )}
                {room.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {room.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Status
                </label>
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </motion.div>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiGrid} className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first room.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700"
          >
            Add Room
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;