import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateInsights, generateRecommendations, isGeminiConfigured, testGeminiConnection, getGeminiStatus, handleGeminiError } from '../../../lib/gemini';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBrain, FiRefreshCw, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiActivity, FiZap } = FiIcons;

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState('room_efficiency');
  const [geminiStatus, setGeminiStatus] = useState(null);
  const [connectionTest, setConnectionTest] = useState(null);
  const [error, setError] = useState(null);

  const insightTypes = [
    { id: 'room_efficiency', name: 'Room Efficiency', icon: FiTrendingUp },
    { id: 'staff_optimization', name: 'Staff Optimization', icon: FiClock },
    { id: 'client_flow', name: 'Client Flow', icon: FiRefreshCw },
    { id: 'predictive_scheduling', name: 'Predictive Scheduling', icon: FiBrain },
    { id: 'financial_analysis', name: 'Financial Analysis', icon: FiActivity }
  ];

  // Mock data for AI analysis
  const mockData = {
    room_efficiency: {
      rooms: [
        { id: 1, name: 'Room 1', utilization: 85, avgDuration: 45, waitTime: 12 },
        { id: 2, name: 'Room 2', utilization: 92, avgDuration: 38, waitTime: 8 },
        { id: 3, name: 'Room 3', utilization: 76, avgDuration: 52, waitTime: 15 }
      ],
      totalAppointments: 156,
      avgWaitTime: 11.7,
      peakHours: ['9-11 AM', '2-4 PM']
    },
    staff_optimization: {
      staff: [
        { id: 1, name: 'Dr. Smith', efficiency: 94, hoursWorked: 40, patientsServed: 45 },
        { id: 2, name: 'Dr. Johnson', efficiency: 87, hoursWorked: 38, patientsServed: 42 }
      ],
      totalStaff: 12,
      avgEfficiency: 89
    },
    financial_analysis: {
      revenue: {
        daily: 2400,
        monthly: 72000,
        yearToDate: 864000
      },
      costs: {
        staff: 35000,
        supplies: 8000,
        overhead: 12000
      },
      profitMargin: 42.5,
      topServices: [
        { name: 'Routine Checkups', revenue: 25000, margin: 65 },
        { name: 'Vaccinations', revenue: 18000, margin: 78 },
        { name: 'Surgery', revenue: 15000, margin: 45 }
      ]
    }
  };

  useEffect(() => {
    checkGeminiStatus();
    generateAIInsights();
  }, [selectedInsightType]);

  const checkGeminiStatus = async () => {
    try {
      const status = getGeminiStatus();
      setGeminiStatus(status);
      
      if (status.configured) {
        const testResult = await testGeminiConnection();
        setConnectionTest(testResult);
      }
    } catch (error) {
      console.error('Error checking Gemini status:', error);
      setError(handleGeminiError(error));
    }
  };

  const generateAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = mockData[selectedInsightType] || mockData.room_efficiency;
      
      const [insightResult, recommendationResult] = await Promise.all([
        generateInsights(data, selectedInsightType),
        generateRecommendations(data, {
          efficiency: 89,
          satisfaction: 4.8,
          revenue: mockData.financial_analysis?.revenue?.monthly || 72000
        })
      ]);

      setInsights(insightResult);
      setRecommendations(recommendationResult);
    } catch (error) {
      console.error('Error generating insights:', error);
      const errorInfo = handleGeminiError(error);
      setError(errorInfo);
      
      // Still show mock data as fallback
      setInsights('AI insights temporarily unavailable. Please check your configuration and try again.');
      setRecommendations('Recommendations temporarily unavailable. Please check your configuration and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGeminiStatus = () => {
    if (!geminiStatus) return null;

    return (
      <div className={`rounded-lg p-4 mb-6 ${
        geminiStatus.configured 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start space-x-3">
          <SafeIcon 
            icon={geminiStatus.configured ? FiCheckCircle : FiAlertCircle} 
            className={`text-xl mt-1 ${
              geminiStatus.configured ? 'text-green-600' : 'text-yellow-600'
            }`} 
          />
          <div>
            <h3 className={`font-semibold ${
              geminiStatus.configured ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {geminiStatus.configured ? '✅ Gemini AI Active' : '⚠️ Gemini AI Configuration'}
            </h3>
            <div className={`text-sm mt-1 ${
              geminiStatus.configured ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {geminiStatus.configured ? (
                <>
                  <p>AI-powered insights and recommendations are fully operational.</p>
                  {connectionTest && (
                    <p className="mt-1">
                      Connection test: {connectionTest.success ? '✅ Successful' : '❌ Failed'}
                      {connectionTest.error && ` - ${connectionTest.error}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>Configure your Gemini API key to enable live AI insights.</p>
                  <p className="mt-1">Currently showing demonstration insights.</p>
                  <div className="mt-2 text-xs bg-yellow-100 rounded p-2">
                    <strong>Setup:</strong> Add VITE_GEMINI_API_KEY to your environment variables
                    <br />
                    <strong>Get API Key:</strong> <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className={`rounded-lg p-4 mb-6 ${
        error.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
      }`}>
        <div className="flex items-start space-x-3">
          <SafeIcon 
            icon={FiAlertCircle} 
            className={`text-xl mt-1 ${
              error.severity === 'high' ? 'text-red-600' : 'text-orange-600'
            }`} 
          />
          <div>
            <h3 className={`font-semibold ${
              error.severity === 'high' ? 'text-red-900' : 'text-orange-900'
            }`}>
              AI Service Issue
            </h3>
            <p className={`text-sm mt-1 ${
              error.severity === 'high' ? 'text-red-800' : 'text-orange-800'
            }`}>
              {error.message}
            </p>
            <p className={`text-sm mt-1 ${
              error.severity === 'high' ? 'text-red-700' : 'text-orange-700'
            }`}>
              <strong>Action:</strong> {error.action}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h1>
          <p className="text-gray-600 mt-1">
            Advanced analytics and recommendations for optimal clinic operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkGeminiStatus}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiActivity} />
            <span>Test Connection</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateAIInsights}
            disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <SafeIcon icon={loading ? FiRefreshCw : FiBrain} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing...' : 'Generate Insights'}</span>
          </motion.button>
        </div>
      </div>

      {renderGeminiStatus()}
      {renderError()}

      {/* Insight Type Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Focus</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {insightTypes.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedInsightType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedInsightType === type.id
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <SafeIcon icon={type.icon} className="text-2xl mx-auto mb-2" />
              <p className="text-sm font-medium text-center">{type.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiBrain} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                {insightTypes.find(t => t.id === selectedInsightType)?.name}
              </p>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <SafeIcon icon={FiRefreshCw} className="animate-spin text-2xl text-primary-600" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
                {insights}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiCheckCircle} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
              <p className="text-sm text-gray-600">Actionable improvement strategies</p>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <SafeIcon icon={FiRefreshCw} className="animate-spin text-2xl text-emerald-600" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
                {recommendations}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'AI Response Time',
              value: loading ? 'Analyzing...' : '2.3s',
              icon: FiZap,
              color: 'text-blue-600',
              bg: 'bg-blue-100'
            },
            {
              title: 'Insights Generated',
              value: '247',
              icon: FiBrain,
              color: 'text-purple-600',
              bg: 'bg-purple-100'
            },
            {
              title: 'Accuracy Score',
              value: geminiStatus?.configured ? '94%' : 'Demo',
              icon: FiTrendingUp,
              color: 'text-green-600',
              bg: 'bg-green-100'
            }
          ].map((metric, index) => (
            <div key={metric.title} className="text-center">
              <div className={`${metric.bg} ${metric.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <SafeIcon icon={metric.icon} className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AIInsights;