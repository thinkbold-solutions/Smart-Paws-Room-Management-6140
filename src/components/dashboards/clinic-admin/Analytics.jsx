import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import { useRoomStore } from '../../../stores/roomStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiTrendingUp, FiUsers, FiClock, FiActivity, FiCalendar, FiBarChart3, FiPieChart, FiTarget, FiRefreshCw } = FiIcons;

const Analytics = () => {
  const { selectedClinic } = useAuthStore();
  const { rooms, appointments, waitingClients, fetchRooms, fetchAppointments, fetchWaitingClients } = useRoomStore();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedChart, setSelectedChart] = useState('overview');

  useEffect(() => {
    if (selectedClinic) {
      fetchRooms(selectedClinic.id);
      fetchAppointments(selectedClinic.id);
      fetchWaitingClients(selectedClinic.id);
    }
  }, [selectedClinic]);

  const periods = [
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' }
  ];

  // Calculate analytics data
  const analyticsData = {
    overview: {
      totalAppointments: appointments.length,
      avgWaitTime: waitingClients.length > 0 
        ? Math.round(waitingClients.reduce((sum, client) => {
            const waitTime = Math.floor((new Date() - new Date(client.check_in_time)) / (1000 * 60));
            return sum + waitTime;
          }, 0) / waitingClients.length)
        : 0,
      roomUtilization: rooms.length > 0 
        ? Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100)
        : 0,
      clientSatisfaction: 4.8 // Mock data
    },
    trends: {
      appointmentGrowth: 15.3,
      waitTimeChange: -8.5,
      utilizationChange: 12.1,
      satisfactionChange: 0.3
    }
  };

  const statCards = [
    {
      title: 'Total Appointments',
      value: analyticsData.overview.totalAppointments,
      change: `+${analyticsData.trends.appointmentGrowth}%`,
      changeType: 'positive',
      icon: FiCalendar,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Avg Wait Time',
      value: `${analyticsData.overview.avgWaitTime} min`,
      change: `${analyticsData.trends.waitTimeChange}%`,
      changeType: 'positive',
      icon: FiClock,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      title: 'Room Utilization',
      value: `${analyticsData.overview.roomUtilization}%`,
      change: `+${analyticsData.trends.utilizationChange}%`,
      changeType: 'positive',
      icon: FiActivity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Client Satisfaction',
      value: `${analyticsData.overview.clientSatisfaction}/5.0`,
      change: `+${analyticsData.trends.satisfactionChange}`,
      changeType: 'positive',
      icon: FiTrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  const chartTabs = [
    { id: 'overview', name: 'Overview', icon: FiBarChart3 },
    { id: 'rooms', name: 'Room Usage', icon: FiActivity },
    { id: 'appointments', name: 'Appointments', icon: FiCalendar },
    { id: 'efficiency', name: 'Efficiency', icon: FiTarget }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Room Status Distribution */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Room Status Distribution</h4>
                <div className="space-y-3">
                  {[
                    { status: 'Available', count: rooms.filter(r => r.status === 'available').length, color: 'bg-green-500' },
                    { status: 'Occupied', count: rooms.filter(r => r.status === 'occupied').length, color: 'bg-blue-500' },
                    { status: 'Cleaning', count: rooms.filter(r => r.status === 'cleaning').length, color: 'bg-yellow-500' },
                    { status: 'Maintenance', count: rooms.filter(r => r.status === 'maintenance').length, color: 'bg-red-500' }
                  ].map((item) => {
                    const percentage = rooms.length > 0 ? (item.count / rooms.length) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${item.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Appointment Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h4>
                <div className="space-y-3">
                  {[
                    { status: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length, color: 'bg-blue-500' },
                    { status: 'In Progress', count: appointments.filter(a => a.status === 'in_progress').length, color: 'bg-orange-500' },
                    { status: 'Completed', count: appointments.filter(a => a.status === 'completed').length, color: 'bg-green-500' },
                    { status: 'No Show', count: appointments.filter(a => a.status === 'no_show').length, color: 'bg-red-500' }
                  ].map((item) => {
                    const percentage = appointments.length > 0 ? (item.count / appointments.length) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${item.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Room Performance Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room, index) => {
                const utilizationScore = Math.floor(Math.random() * 40) + 60; // Mock data 60-100%
                const avgDuration = Math.floor(Math.random() * 30) + 30; // Mock data 30-60 min
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        {room.room_name || `Room ${room.room_number}`}
                      </h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.status === 'available' ? 'bg-green-100 text-green-800' :
                        room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                        room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Utilization</span>
                        <span className="font-medium">{utilizationScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationScore >= 80 ? 'bg-green-500' :
                            utilizationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${utilizationScore}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Duration</span>
                        <span className="font-medium">{avgDuration} min</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Appointment Analytics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Peak Hours Analysis</h5>
                <div className="space-y-3">
                  {[
                    { hour: '8:00 AM', appointments: 3, color: 'bg-blue-300' },
                    { hour: '9:00 AM', appointments: 7, color: 'bg-blue-500' },
                    { hour: '10:00 AM', appointments: 12, color: 'bg-blue-700' },
                    { hour: '11:00 AM', appointments: 8, color: 'bg-blue-500' },
                    { hour: '12:00 PM', appointments: 4, color: 'bg-blue-300' },
                    { hour: '1:00 PM', appointments: 6, color: 'bg-blue-400' },
                    { hour: '2:00 PM', appointments: 10, color: 'bg-blue-600' },
                    { hour: '3:00 PM', appointments: 9, color: 'bg-blue-500' }
                  ].map((slot) => (
                    <div key={slot.hour} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 w-16">{slot.hour}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${slot.color}`}
                          style={{ width: `${(slot.appointments / 12) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-6">{slot.appointments}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Appointment Types</h5>
                <div className="space-y-3">
                  {[
                    { type: 'Routine Checkup', count: 45, percentage: 60, color: 'bg-green-500' },
                    { type: 'Vaccination', count: 15, percentage: 20, color: 'bg-blue-500' },
                    { type: 'Emergency', count: 8, percentage: 11, color: 'bg-red-500' },
                    { type: 'Surgery', count: 7, percentage: 9, color: 'bg-purple-500' }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{item.count}</span>
                        <span className="text-xs text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'efficiency':
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Efficiency Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  title: 'Overall Efficiency',
                  value: '87%',
                  target: '85%',
                  status: 'good',
                  description: 'Above target performance'
                },
                { 
                  title: 'Average Turnaround',
                  value: '28 min',
                  target: '30 min',
                  status: 'good',
                  description: 'Meeting time goals'
                },
                { 
                  title: 'Resource Utilization',
                  value: '76%',
                  target: '80%',
                  status: 'warning',
                  description: 'Room optimization needed'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-6"
                >
                  <div className="text-center">
                    <h5 className="font-medium text-gray-900 mb-2">{metric.title}</h5>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-sm text-gray-600 mb-3">Target: {metric.target}</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      metric.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {metric.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Select a chart type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your clinic's performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              fetchRooms(selectedClinic.id);
              fetchAppointments(selectedClinic.id);
              fetchWaitingClients(selectedClinic.id);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiRefreshCw} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
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
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last {selectedPeriod}</span>
                </div>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
          <div className="flex space-x-2">
            {chartTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedChart(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  selectedChart === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SafeIcon icon={tab.icon} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="min-h-96">
          {renderChart()}
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <SafeIcon icon={FiUsers} className="text-blue-600 text-xl" />
              <h4 className="font-medium text-gray-900">Client Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Clients</span>
                <span className="text-sm font-medium text-gray-900">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Returning Clients</span>
                <span className="text-sm font-medium text-gray-900">133</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">No-Shows</span>
                <span className="text-sm font-medium text-red-600">8</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <SafeIcon icon={FiClock} className="text-orange-600 text-xl" />
              <h4 className="font-medium text-gray-900">Time Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Appointment Duration</span>
                <span className="text-sm font-medium text-gray-900">32 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Check-in Time</span>
                <span className="text-sm font-medium text-gray-900">3 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Peak Hours</span>
                <span className="text-sm font-medium text-gray-900">9-11 AM</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <SafeIcon icon={FiTrendingUp} className="text-green-600 text-xl" />
              <h4 className="font-medium text-gray-900">Revenue Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-sm font-medium text-gray-900">$12,400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Per Visit</span>
                <span className="text-sm font-medium text-gray-900">$79</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-sm font-medium text-green-600">+15.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;