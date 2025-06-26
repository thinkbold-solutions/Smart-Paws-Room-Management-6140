import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiTrendingUp, FiActivity, FiClock, FiUsers, FiBarChart3, FiPieChart, FiTarget, FiZap } = FiIcons;

const AnalyticsOverview = () => {
  const { user, selectedClinic } = useAuthStore();
  const { overviewMetrics, trends, loading, fetchOverviewMetrics, fetchTrends } = useAnalyticsStore();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');

  useEffect(() => {
    if (selectedClinic) {
      fetchOverviewMetrics(selectedClinic.id, selectedPeriod);
      fetchTrends(selectedClinic.id, selectedPeriod);
    }
  }, [selectedClinic, selectedPeriod]);

  const periods = [
    { id: 'day', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' }
  ];

  const metricCards = [
    {
      title: 'Room Efficiency',
      value: `${overviewMetrics?.roomEfficiency || 0}%`,
      change: trends?.roomEfficiency || 0,
      icon: FiActivity,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      target: 85
    },
    {
      title: 'Average Wait Time',
      value: `${overviewMetrics?.avgWaitTime || 0} min`,
      change: trends?.waitTime || 0,
      icon: FiClock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      target: 15,
      inverse: true
    },
    {
      title: 'Patient Throughput',
      value: overviewMetrics?.patientThroughput || 0,
      change: trends?.throughput || 0,
      icon: FiUsers,
      color: 'text-green-600',
      bg: 'bg-green-100',
      target: 50
    },
    {
      title: 'Revenue per Hour',
      value: `$${overviewMetrics?.revenuePerHour || 0}`,
      change: trends?.revenue || 0,
      icon: FiTrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      target: 200
    }
  ];

  const getChangeColor = (change, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    return isPositive ? '↗' : '↘';
  };

  const getPerformanceColor = (value, target, inverse = false) => {
    const numValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    const performance = inverse ? target / numValue : numValue / target;
    
    if (performance >= 1) return 'text-green-600';
    if (performance >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive performance insights for {selectedClinic?.name}
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
              fetchOverviewMetrics(selectedClinic.id, selectedPeriod);
              fetchTrends(selectedClinic.id, selectedPeriod);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiActivity} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.bg} ${metric.color} p-3 rounded-lg`}>
                <SafeIcon icon={metric.icon} className="text-xl" />
              </div>
              <div className={`text-right ${getPerformanceColor(metric.value, metric.target, metric.inverse)}`}>
                <SafeIcon icon={FiTarget} className="text-lg" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</p>
              <div className="flex items-center justify-between">
                <div className={`flex items-center text-sm font-medium ${getChangeColor(metric.change, metric.inverse)}`}>
                  <span className="mr-1">{getChangeIcon(metric.change, metric.inverse)}</span>
                  <span>{Math.abs(metric.change)}%</span>
                </div>
                <div className="text-xs text-gray-500">
                  Target: {metric.inverse ? `<${metric.target}` : `${metric.target}+`}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiBarChart3} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
              <p className="text-sm text-gray-600">Key metrics over time</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Room Utilization', value: 78, target: 85, trend: 'up' },
              { name: 'Staff Efficiency', value: 92, target: 90, trend: 'up' },
              { name: 'Client Satisfaction', value: 4.8, target: 4.5, trend: 'up' },
              { name: 'No-Show Rate', value: 8, target: 10, trend: 'down' }
            ].map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / item.target) * 100}%` }}
                      transition={{ delay: index * 0.2, duration: 1 }}
                      className={`h-2 rounded-full ${
                        item.value >= item.target ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {item.name === 'Client Satisfaction' ? item.value : `${item.value}%`}
                  </span>
                  <div className={`text-sm ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.trend === 'up' ? '↗' : '↘'}
                  </div>
                </div>
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
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiZap} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Insights</h3>
              <p className="text-sm text-gray-600">AI-powered recommendations</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SafeIcon icon={FiTrendingUp} className="text-blue-600 text-lg mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900">Peak Hour Optimization</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Consider adding a second staff member during 2-4 PM to reduce wait times by 23%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SafeIcon icon={FiActivity} className="text-green-600 text-lg mt-1" />
                <div>
                  <h4 className="font-medium text-green-900">Room Efficiency Boost</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Room 3 shows 15% longer appointment times. Consider equipment check or staff training.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SafeIcon icon={FiUsers} className="text-orange-600 text-lg mt-1" />
                <div>
                  <h4 className="font-medium text-orange-900">Client Flow Enhancement</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    Implementing digital check-in could reduce front desk bottlenecks by 30%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Analytics Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
          <div className="flex space-x-2">
            {[
              { id: 'efficiency', name: 'Efficiency', icon: FiActivity },
              { id: 'revenue', name: 'Revenue', icon: FiTrendingUp },
              { id: 'satisfaction', name: 'Satisfaction', icon: FiUsers },
              { id: 'trends', name: 'Trends', icon: FiBarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  selectedMetric === tab.id
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
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <SafeIcon icon={FiPieChart} className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Interactive charts would be displayed here</p>
            <p className="text-sm text-gray-400 mt-1">
              Showing {selectedMetric} analytics for {selectedPeriod}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsOverview;