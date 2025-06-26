import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import { dbManager } from '../../../lib/database';
import supabase from '../../../lib/supabase';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiUsers, FiClock, FiActivity, FiTrendingUp, FiAlertCircle, FiRefreshCw } = FiIcons;

const ClinicOverview = () => {
  const { user, selectedClinic } = useAuthStore();
  const { rooms, appointments, waitingClients, fetchRooms, fetchAppointments, fetchWaitingClients } = useRoomStore();
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    waitingClients: 0,
    todayAppointments: 0,
    avgWaitTime: 0,
    efficiency: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [realTimeSubscriptions, setRealTimeSubscriptions] = useState([]);

  // Enhanced data fetching with real-time updates
  const fetchAllData = async () => {
    if (!selectedClinic?.id) {
      dbManager.log('warn', 'No clinic selected for overview');
      return;
    }

    setLoading(true);
    try {
      dbManager.log('info', `🏥 Fetching live data for clinic: ${selectedClinic.name}`);

      // Fetch all data concurrently
      await Promise.all([
        fetchRooms(selectedClinic.id),
        fetchAppointments(selectedClinic.id),
        fetchWaitingClients(selectedClinic.id)
      ]);

      setLastUpdated(new Date());
      dbManager.log('info', '✅ All clinic data fetched successfully');

    } catch (error) {
      dbManager.log('error', 'Failed to fetch clinic data', error);
      toast.error('Failed to load clinic data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  const setupRealTimeUpdates = () => {
    if (!selectedClinic?.id) return;

    dbManager.log('info', '🔄 Setting up real-time subscriptions for clinic overview');

    const subscriptions = [];

    // Rooms subscription
    const roomsSubscription = supabase
      .channel('clinic_rooms_overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sp_rooms_live',
        filter: `clinic_id=eq.${selectedClinic.id}`
      }, (payload) => {
        dbManager.log('info', '🏠 Room update received', payload);
        fetchRooms(selectedClinic.id);
        toast.success('Room status updated', { duration: 2000, icon: '🏠' });
      })
      .subscribe();

    // Appointments subscription
    const appointmentsSubscription = supabase
      .channel('clinic_appointments_overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sp_appointments_live',
        filter: `clinic_id=eq.${selectedClinic.id}`
      }, (payload) => {
        dbManager.log('info', '📅 Appointment update received', payload);
        fetchAppointments(selectedClinic.id);
        toast.success('Appointments updated', { duration: 2000, icon: '📅' });
      })
      .subscribe();

    // Waiting queue subscription
    const waitingSubscription = supabase
      .channel('clinic_waiting_overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sp_waiting_queue_live',
        filter: `clinic_id=eq.${selectedClinic.id}`
      }, (payload) => {
        dbManager.log('info', '⏳ Waiting queue update received', payload);
        fetchWaitingClients(selectedClinic.id);
        toast.success('Waiting queue updated', { duration: 2000, icon: '⏳' });
      })
      .subscribe();

    // Room assignments subscription
    const assignmentsSubscription = supabase
      .channel('clinic_assignments_overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sp_room_assignments_live'
      }, (payload) => {
        dbManager.log('info', '👨‍⚕️ Room assignment update received', payload);
        fetchRooms(selectedClinic.id);
        toast.success('Room assignments updated', { duration: 2000, icon: '👨‍⚕️' });
      })
      .subscribe();

    subscriptions.push(roomsSubscription, appointmentsSubscription, waitingSubscription, assignmentsSubscription);
    setRealTimeSubscriptions(subscriptions);

    dbManager.log('info', `✅ ${subscriptions.length} real-time subscriptions established`);
  };

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    realTimeSubscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    setRealTimeSubscriptions([]);
    dbManager.log('info', '🧹 Real-time subscriptions cleaned up');
  };

  // Initial load and setup
  useEffect(() => {
    if (selectedClinic?.id) {
      fetchAllData();
      setupRealTimeUpdates();
    }

    return cleanupSubscriptions;
  }, [selectedClinic?.id]);

  // Calculate stats from live data
  useEffect(() => {
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const avgWaitTime = waitingClients.length > 0 ? 
      waitingClients.reduce((sum, client) => {
        const waitTime = Math.floor((new Date() - new Date(client.check_in_time)) / (1000 * 60));
        return sum + waitTime;
      }, 0) / waitingClients.length : 0;

    setStats({
      totalRooms: rooms.length,
      occupiedRooms,
      waitingClients: waitingClients.length,
      todayAppointments: appointments.length,
      avgWaitTime: Math.round(avgWaitTime),
      efficiency: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0
    });

    setLastUpdated(new Date());
  }, [rooms, appointments, waitingClients]);

  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: FiGrid,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Occupied Rooms',
      value: `${stats.occupiedRooms}/${stats.totalRooms}`,
      icon: FiActivity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Waiting Clients',
      value: stats.waitingClients,
      icon: FiUsers,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      alert: stats.waitingClients > 5
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: FiClock,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Avg Wait Time',
      value: `${stats.avgWaitTime} min`,
      icon: FiClock,
      color: 'text-red-600',
      bg: 'bg-red-100',
      alert: stats.avgWaitTime > 20
    },
    {
      title: 'Room Efficiency',
      value: `${stats.efficiency}%`,
      icon: FiTrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-blue-100 text-blue-800 border-blue-200',
      cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      maintenance: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.available;
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-primary-600 mb-4" />
        <span className="text-lg text-gray-700">Loading clinic overview...</span>
        <span className="text-sm text-gray-500 mt-2">Fetching real-time data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedClinic?.name} - Live Operations Dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchAllData}
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <SafeIcon icon={FiRefreshCw} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      {/* Live Data Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <SafeIcon icon={FiActivity} className="text-green-600" />
          <span className="text-sm text-green-800 font-medium">Live Data Active</span>
          <span className="text-xs text-green-600">• {realTimeSubscriptions.length} real-time connections</span>
          <span className="text-xs text-green-600">• Auto-updates enabled</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
              stat.alert ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${stat.alert ? 'text-orange-700' : 'text-gray-600'}`}>
                  {stat.title}
                  {stat.alert && <SafeIcon icon={FiAlertCircle} className="inline ml-1" />}
                </p>
                <p className={`text-2xl font-bold mt-2 ${stat.alert ? 'text-orange-800' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Room Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Room Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {rooms.slice(0, 6).map((room) => {
              const assignment = room.room_assignments?.find(a => !a.unassigned_at);
              const duration = assignment ? 
                Math.floor((new Date() - new Date(assignment.assigned_at)) / (1000 * 60)) : 0;

              return (
                <div key={room.id} className={`p-3 rounded-lg border-2 ${getStatusColor(room.status)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {room.room_name || `Room ${room.room_number}`}
                      </p>
                      <p className="text-sm text-gray-600">{room.room_type}</p>
                      {assignment?.appointments && (
                        <div className="mt-1 text-xs text-gray-600">
                          Patient: {assignment.appointments.clients?.first_name} {assignment.appointments.clients?.last_name}
                          {duration > 0 && (
                            <span className="ml-2">• {duration} min</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status).split(' ').slice(0, 2).join(' ')}`}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {rooms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <SafeIcon icon={FiGrid} className="text-3xl mx-auto mb-2" />
              <p>No rooms configured</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Waiting Queue</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {waitingClients.length > 0 ? (
              waitingClients.slice(0, 5).map((client, index) => {
                const waitTime = Math.floor((new Date() - new Date(client.check_in_time)) / (1000 * 60));
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.clients?.first_name} {client.clients?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pet: {client.pets?.name} | {client.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${waitTime > 20 ? 'text-red-600' : waitTime > 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {waitTime} min
                      </p>
                      <p className="text-xs text-gray-500">waiting</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SafeIcon icon={FiUsers} className="text-3xl mx-auto mb-2" />
                <p>No clients waiting</p>
              </div>
            )}
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
            { name: 'Room Board', icon: FiGrid, href: '/clinic-admin/rooms', count: rooms.length },
            { name: 'Appointments', icon: FiClock, href: '/clinic-admin/appointments', count: appointments.length },
            { name: 'Analytics', icon: FiTrendingUp, href: '/clinic-admin/analytics' },
            { name: 'Staff Management', icon: FiUsers, href: '/clinic-admin/staff' }
          ].map((action) => (
            <motion.button
              key={action.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200 hover:border-primary-300 transition-all relative"
            >
              <SafeIcon icon={action.icon} className="text-2xl text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">{action.name}</p>
              {action.count !== undefined && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {action.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Alerts */}
      {(stats.waitingClients > 5 || stats.avgWaitTime > 20) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <SafeIcon icon={FiAlertCircle} className="text-yellow-600 text-xl mt-1" />
            <div>
              <h4 className="text-lg font-semibold text-yellow-900 mb-2">
                🚨 Attention Required
              </h4>
              <div className="space-y-1 text-yellow-800">
                {stats.waitingClients > 5 && (
                  <p>• High number of waiting clients ({stats.waitingClients})</p>
                )}
                {stats.avgWaitTime > 20 && (
                  <p>• Average wait time is high ({stats.avgWaitTime} minutes)</p>
                )}
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Consider optimizing room assignments or adding staff to reduce wait times.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ClinicOverview;