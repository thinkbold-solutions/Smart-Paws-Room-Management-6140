import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { generateInsights } from '../../lib/gemini';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBrain, FiTrendingUp, FiAlertTriangle, FiCalendar, FiClock, FiUsers, FiTarget } = FiIcons;

const PredictiveAnalytics = () => {
  const { selectedClinic } = useAuthStore();
  const { fetchOverviewMetrics, overviewMetrics } = useAnalyticsStore();
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    if (selectedClinic) {
      generatePredictions();
    }
  }, [selectedClinic, selectedTimeframe]);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      // Mock predictive data
      const mockPredictions = {
        nextWeek: {
          expectedAppointments: 156 + Math.floor(Math.random() * 40) - 20,
          peakHours: ['9:00-11:00 AM', '2:00-4:00 PM'],
          roomDemand: {
            'Room 1': 85,
            'Room 2': 92,
            'Room 3': 78,
            'Surgery Room': 65
          },
          staffNeeds: {
            veterinarians: 3,
            technicians: 5,
            receptionists: 2
          },
          potentialBottlenecks: [
            {
              type: 'room_shortage',
              time: 'Tuesday 2:00-3:00 PM',
              severity: 'high',
              description: 'Expected 15% over capacity'
            },
            {
              type: 'staff_shortage',
              time: 'Friday morning',
              severity: 'medium',
              description: 'Dr. Johnson scheduled off, high appointment volume'
            }
          ]
        },
        trends: {
          appointmentGrowth: 12.5,
          seasonalFactors: 'Spring vaccination season approaching',
          clientRetention: 94.2,
          newClientProjection: 23
        }
      };

      const mockRecommendations = [
        {
          priority: 'high',
          category: 'scheduling',
          title: 'Optimize Tuesday Afternoon Schedule',
          description: 'Add 30-minute buffer between appointments on Tuesday 2-4 PM to prevent bottlenecks',
          impact: 'Reduce wait times by 25%',
          effort: 'Low'
        },
        {
          priority: 'medium',
          category: 'staffing',
          title: 'Schedule Additional Technician',
          description: 'Consider part-time technician for Friday mornings when Dr. Johnson is off',
          impact: 'Maintain service quality',
          effort: 'Medium'
        },
        {
          priority: 'low',
          category: 'capacity',
          title: 'Room Utilization Enhancement',
          description: 'Surgery room shows low utilization - consider converting for general use during peak hours',
          impact: 'Increase overall capacity by 15%',
          effort: 'High'
        }
      ];

      setPredictions(mockPredictions);
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics</h1>
          <p className="text-gray-600 mt-1">
            AI-powered forecasts and recommendations for optimal clinic operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">Next Week</option>
            <option value="month">Next Month</option>
            <option value="quarter">Next Quarter</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePredictions}
            disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <SafeIcon icon={FiBrain} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing...' : 'Generate Forecast'}</span>
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <SafeIcon icon={FiBrain} className="animate-spin text-4xl text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Generating predictions...</span>
        </div>
      ) : (
        <>
          {/* Forecast Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {predictions && [
              {
                title: 'Expected Appointments',
                value: predictions.nextWeek.expectedAppointments,
                change: `+${predictions.trends.appointmentGrowth}%`,
                icon: FiCalendar,
                color: 'text-blue-600',
                bg: 'bg-blue-100'
              },
              {
                title: 'Peak Demand Hours',
                value: predictions.nextWeek.peakHours.length,
                subtitle: 'time slots',
                icon: FiClock,
                color: 'text-orange-600',
                bg: 'bg-orange-100'
              },
              {
                title: 'New Clients Expected',
                value: predictions.trends.newClientProjection,
                change: 'Projected',
                icon: FiUsers,
                color: 'text-green-600',
                bg: 'bg-green-100'
              },
              {
                title: 'Retention Rate',
                value: `${predictions.trends.clientRetention}%`,
                change: 'Stable',
                icon: FiTarget,
                color: 'text-purple-600',
                bg: 'bg-purple-100'
              }
            ].map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${metric.bg} ${metric.color} p-3 rounded-lg`}>
                    <SafeIcon icon={metric.icon} className="text-xl" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {metric.value}
                    {metric.subtitle && <span className="text-sm text-gray-500"> {metric.subtitle}</span>}
                  </p>
                  {metric.change && (
                    <p className="text-sm text-green-600 font-medium">{metric.change}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Potential Bottlenecks */}
          {predictions?.nextWeek.potentialBottlenecks && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiAlertTriangle} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Potential Bottlenecks</h3>
                  <p className="text-sm text-gray-600">Predicted capacity issues to prevent</p>
                </div>
              </div>
              <div className="space-y-4">
                {predictions.nextWeek.potentialBottlenecks.map((bottleneck, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getSeverityColor(bottleneck.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(bottleneck.severity)}`}>
                            {bottleneck.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{bottleneck.time}</span>
                        </div>
                        <p className="text-gray-700">{bottleneck.description}</p>
                      </div>
                      <SafeIcon icon={FiAlertTriangle} className="text-orange-600 text-lg" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Room Demand Forecast */}
          {predictions?.nextWeek.roomDemand && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Room Demand Forecast</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(predictions.nextWeek.roomDemand).map(([room, demand], index) => (
                  <motion.div
                    key={room}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-2">{room}</h4>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{demand}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            demand >= 90 ? 'bg-red-500' : demand >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${demand}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Expected utilization</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Recommendations */}
          {recommendations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiBrain} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                  <p className="text-sm text-gray-600">Actionable insights to optimize operations</p>
                </div>
              </div>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">{rec.category}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                        <p className="text-gray-700 mb-3">{rec.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <SafeIcon icon={FiTrendingUp} className="text-green-600" />
                            <span className="text-green-600 font-medium">{rec.impact}</span>
                          </div>
                          <div className="text-gray-500">
                            Effort: <span className="font-medium">{rec.effort}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="ml-4 bg-primary-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-700"
                      >
                        Implement
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictiveAnalytics;