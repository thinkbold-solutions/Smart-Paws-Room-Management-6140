import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBuilding, FiUsers, FiActivity, FiTrendingUp, FiDollarSign, FiClock } = FiIcons;

const AgencyOverview = () => {
  const { user, clinics } = useAuthStore();
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalUsers: 0,
    activeRooms: 0,
    monthlyRevenue: 0,
    avgWaitTime: 0,
    satisfactionScore: 0
  });

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setStats({
      totalClinics: clinics.length || 12,
      totalUsers: 156,
      activeRooms: 34,
      monthlyRevenue: 45600,
      avgWaitTime: 12,
      satisfactionScore: 4.8
    });
  }, [clinics]);

  const statCards = [
    {
      title: 'Total Clinics',
      value: stats.totalClinics,
      icon: FiBuilding,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      change: '+2.5%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'text-green-600',
      bg: 'bg-green-100',
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      title: 'Active Rooms',
      value: stats.activeRooms,
      icon: FiActivity,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      change: '+5.1%',
      changeType: 'positive'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      change: '+18.2%',
      changeType: 'positive'
    },
    {
      title: 'Avg Wait Time',
      value: `${stats.avgWaitTime} min`,
      icon: FiClock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      change: '-8.5%',
      changeType: 'positive'
    },
    {
      title: 'Satisfaction',
      value: `${stats.satisfactionScore}/5.0`,
      icon: FiTrendingUp,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
      change: '+0.3',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening across your clinic network today.
          </p>
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
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Clinic Activity</h3>
          <div className="space-y-4">
            {[
              { clinic: 'Downtown Vet Clinic', action: 'New appointment scheduled', time: '2 min ago' },
              { clinic: 'Westside Animal Hospital', action: 'Room 3 marked as available', time: '5 min ago' },
              { clinic: 'Pet Care Plus', action: 'Staff member clocked in', time: '12 min ago' },
              { clinic: 'Happy Paws Clinic', action: 'Client checked in', time: '18 min ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.clinic}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Clinics</h3>
          <div className="space-y-4">
            {[
              { name: 'Downtown Vet Clinic', efficiency: 94, revenue: '$12,400' },
              { name: 'Westside Animal Hospital', efficiency: 91, revenue: '$11,200' },
              { name: 'Pet Care Plus', efficiency: 89, revenue: '$10,800' },
              { name: 'Happy Paws Clinic', efficiency: 87, revenue: '$9,600' },
            ].map((clinic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{clinic.name}</p>
                  <p className="text-sm text-gray-600">Efficiency: {clinic.efficiency}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{clinic.revenue}</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyOverview;