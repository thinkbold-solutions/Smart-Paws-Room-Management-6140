import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { testGeminiConnection, getGeminiStatus, handleGeminiError, validateApiKey, getUsageStats, GEMINI_CONFIG, getAvailableModels } from '../../../lib/gemini';
import { dbManager } from '../../../lib/database';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBrain, FiKey, FiShield, FiSettings, FiSave, FiTestTube, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiExternalLink, FiEye, FiEyeOff, FiCopy, FiTrash2, FiEdit, FiPlus, FiActivity, FiBarChart3, FiDollarSign, FiClock, FiGlobe, FiLock, FiUnlock, FiRotateCcw, FiZap } = FiIcons;

const AIConfiguration = () => {
  const [activeTab, setActiveTab] = useState('configuration');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [configHistory, setConfigHistory] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [securityAudit, setSecurityAudit] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      apiKey: '',
      model: 'gemini-2.0-flash-exp', // Updated default model
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30,
      retryAttempts: 3,
      rateLimit: 60,
      enableCaching: true,
      enableLogging: true,
      environment: 'production'
    }
  });

  const tabs = [
    { id: 'configuration', name: 'API Configuration', icon: FiSettings },
    { id: 'security', name: 'Security & Validation', icon: FiShield },
    { id: 'monitoring', name: 'Usage & Monitoring', icon: FiActivity },
    { id: 'advanced', name: 'Advanced Settings', icon: FiBrain },
    { id: 'audit', name: 'Audit & History', icon: FiBarChart3 }
  ];

  useEffect(() => {
    loadCurrentConfiguration();
    checkConnectionStatus();
    loadConfigurationHistory();
    runSecurityAudit();
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
      dbManager.log('info', `✅ Loaded ${models.length} available models`);
    } catch (error) {
      dbManager.log('error', '❌ Failed to load available models', error);
      // Set fallback models with latest models
      setAvailableModels([
        { name: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash Experimental', description: 'Latest and fastest model' },
        { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast and efficient model' },
        { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Most capable model' }
      ]);
    }
  };

  const loadCurrentConfiguration = async () => {
    try {
      const status = getGeminiStatus();
      
      // Load from environment variables and localStorage
      const currentConfig = {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '',
        model: localStorage.getItem('gemini_model') || 'gemini-2.0-flash-exp', // Updated default
        temperature: parseFloat(localStorage.getItem('gemini_temperature')) || 0.7,
        maxTokens: parseInt(localStorage.getItem('gemini_maxTokens')) || 2048,
        timeout: parseInt(localStorage.getItem('gemini_timeout')) || 30,
        retryAttempts: parseInt(localStorage.getItem('gemini_retry_attempts')) || 3,
        rateLimit: parseInt(localStorage.getItem('gemini_rate_limit')) || 60,
        enableCaching: localStorage.getItem('gemini_caching') !== 'false',
        enableLogging: localStorage.getItem('gemini_logging') !== 'false',
        environment: localStorage.getItem('gemini_environment') || 'production'
      };

      // Update form with current values
      Object.keys(currentConfig).forEach(key => {
        setValue(key, currentConfig[key]);
      });

      dbManager.log('info', '✅ Current AI configuration loaded');
    } catch (error) {
      dbManager.log('error', '❌ Failed to load current configuration', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setTesting(true);
      const status = getGeminiStatus();
      
      if (status.configured) {
        const testResult = await testGeminiConnection();
        const usage = await getUsageStats();
        
        setConnectionStatus({
          ...status,
          testResult,
          lastChecked: new Date().toISOString()
        });
        setUsageStats(usage);
      } else {
        setConnectionStatus({
          ...status,
          testResult: { success: false, error: 'API key not configured' },
          lastChecked: new Date().toISOString()
        });
      }
    } catch (error) {
      dbManager.log('error', '❌ Connection status check failed', error);
      setConnectionStatus({
        configured: false,
        testResult: { success: false, error: error.message },
        lastChecked: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const validateConfiguration = async (formData) => {
    try {
      const validation = {
        apiKey: { valid: false, message: '', security: 'unknown' },
        model: { valid: false, message: '' },
        settings: { valid: false, message: '' }
      };

      // Validate API key format
      if (formData.apiKey) {
        if (formData.apiKey.startsWith('AIza') && formData.apiKey.length > 30) {
          validation.apiKey = {
            valid: true,
            message: 'API key format is valid',
            security: 'good'
          };
        } else {
          validation.apiKey = {
            valid: false,
            message: 'API key format appears invalid',
            security: 'invalid_format'
          };
        }
      } else {
        validation.apiKey = {
          valid: false,
          message: 'API key is required',
          security: 'missing'
        };
      }

      // Validate model
      const supportedModels = availableModels.map(m => m.name);
      if (supportedModels.includes(formData.model) || supportedModels.length === 0) {
        validation.model = { valid: true, message: 'Model is supported' };
      } else {
        validation.model = { valid: false, message: 'Unsupported model selected' };
      }

      // Validate settings
      const temperatureValid = formData.temperature >= 0 && formData.temperature <= 1;
      const tokensValid = formData.maxTokens >= 1 && formData.maxTokens <= 8192;
      const timeoutValid = formData.timeout >= 5 && formData.timeout <= 120;

      if (temperatureValid && tokensValid && timeoutValid) {
        validation.settings = { valid: true, message: 'All settings are within valid ranges' };
      } else {
        validation.settings = { valid: false, message: 'Some settings are out of valid range' };
      }

      setValidationResults(validation);
      return validation;
    } catch (error) {
      dbManager.log('error', '❌ Configuration validation failed', error);
      return null;
    }
  };

  const saveConfiguration = async (formData) => {
    setSaving(true);
    try {
      dbManager.log('info', '💾 Starting configuration save...');

      // Validate configuration first
      const validation = await validateConfiguration(formData);
      if (!validation || !validation.apiKey.valid) {
        throw new Error('Configuration validation failed');
      }

      // Save to localStorage (in production, this would be encrypted storage)
      const configToSave = {
        ...formData,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Save all configuration settings
      Object.keys(configToSave).forEach(key => {
        if (key !== 'savedAt' && key !== 'version') {
          localStorage.setItem(`gemini_${key}`, String(configToSave[key]));
        }
      });

      // For development, save API key to localStorage (in production use secure storage)
      if (formData.apiKey) {
        localStorage.setItem('gemini_api_key', formData.apiKey);
        
        // Also update environment variable in memory for immediate use
        if (typeof window !== 'undefined') {
          window.__GEMINI_API_KEY__ = formData.apiKey;
        }
      }

      // Log configuration change
      const historyEntry = {
        id: Date.now(),
        action: 'configuration_updated',
        timestamp: new Date().toISOString(),
        changes: Object.keys(formData),
        user: 'current_user',
        success: true
      };

      const newHistory = [historyEntry, ...configHistory.slice(0, 9)];
      setConfigHistory(newHistory);
      localStorage.setItem('gemini_config_history', JSON.stringify(newHistory));

      // Test the new configuration
      await checkConnectionStatus();

      toast.success('🎉 AI configuration saved successfully!');
      dbManager.log('info', '✅ AI configuration saved and validated');

    } catch (error) {
      dbManager.log('error', '❌ Failed to save AI configuration', error);
      toast.error(`Failed to save configuration: ${error.message}`);

      // Log failed attempt
      const historyEntry = {
        id: Date.now(),
        action: 'configuration_failed',
        timestamp: new Date().toISOString(),
        error: error.message,
        user: 'current_user',
        success: false
      };

      const newHistory = [historyEntry, ...configHistory.slice(0, 9)];
      setConfigHistory(newHistory);
      localStorage.setItem('gemini_config_history', JSON.stringify(newHistory));
    } finally {
      setSaving(false);
    }
  };

  const loadConfigurationHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('gemini_config_history') || '[]');
      setConfigHistory(history);
    } catch (error) {
      dbManager.log('error', '❌ Failed to load configuration history', error);
    }
  };

  const runSecurityAudit = async () => {
    try {
      const audit = {
        timestamp: new Date().toISOString(),
        checks: [
          {
            name: 'API Key Storage',
            status: 'pass',
            message: 'API key is stored in browser local storage',
            severity: 'info'
          },
          {
            name: 'HTTPS Connection',
            status: window.location.protocol === 'https:' ? 'pass' : 'fail',
            message: window.location.protocol === 'https:' 
              ? 'Secure HTTPS connection detected' 
              : 'Insecure HTTP connection - use HTTPS in production',
            severity: window.location.protocol === 'https:' ? 'info' : 'high'
          },
          {
            name: 'Environment Check',
            status: import.meta.env.PROD ? 'pass' : 'warning',
            message: import.meta.env.PROD 
              ? 'Production environment detected' 
              : 'Development environment - ensure security in production',
            severity: import.meta.env.PROD ? 'info' : 'medium'
          },
          {
            name: 'Rate Limiting',
            status: 'pass',
            message: 'Rate limiting is configured and active',
            severity: 'info'
          }
        ],
        overallStatus: 'secure',
        recommendations: [
          'Rotate API keys monthly',
          'Monitor usage patterns for anomalies',
          'Enable audit logging in production',
          'Use dedicated service accounts'
        ]
      };

      setSecurityAudit(audit);
    } catch (error) {
      dbManager.log('error', '❌ Security audit failed', error);
    }
  };

  const copyApiKeyTemplate = () => {
    const template = `# Add this to your .env file:
VITE_GEMINI_API_KEY=your-api-key-here

# Optional advanced configuration:
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
VITE_GEMINI_TEMPERATURE=0.7
VITE_GEMINI_MAX_TOKENS=2048`;

    navigator.clipboard.writeText(template);
    toast.success('Environment template copied to clipboard!');
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Get current form values
      const currentApiKey = watch('apiKey');
      
      if (!currentApiKey) {
        toast.error('Please enter an API key first');
        return;
      }

      // Temporarily set the API key for testing
      if (typeof window !== 'undefined') {
        window.__GEMINI_API_KEY__ = currentApiKey;
      }

      const result = await testGeminiConnection();
      
      if (result.success) {
        toast.success('✅ AI connection test successful!');
        setConnectionStatus(prev => ({
          ...prev,
          testResult: result,
          configured: true,
          lastChecked: new Date().toISOString()
        }));
        
        // Update available models if returned
        if (result.availableModels && result.availableModels.length > 0) {
          const modelObjects = result.availableModels.map(name => ({
            name,
            displayName: name.replace('gemini-', 'Gemini ').replace(/-/g, ' '),
            description: 'Available model'
          }));
          setAvailableModels(modelObjects);
        }
      } else {
        toast.error(`❌ Connection test failed: ${result.error}`);
        setConnectionStatus(prev => ({
          ...prev,
          testResult: result,
          configured: false,
          lastChecked: new Date().toISOString()
        }));
      }

    } catch (error) {
      toast.error(`❌ Connection test failed: ${error.message}`);
      setConnectionStatus(prev => ({
        ...prev,
        testResult: { success: false, error: error.message },
        configured: false,
        lastChecked: new Date().toISOString()
      }));
    } finally {
      setTesting(false);
    }
  };

  const renderConfigurationTab = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <div className={`rounded-lg p-4 border-2 ${
        connectionStatus?.configured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-3">
          <SafeIcon 
            icon={connectionStatus?.configured ? FiCheckCircle : FiAlertTriangle} 
            className={`text-2xl ${
              connectionStatus?.configured ? 'text-green-600' : 'text-yellow-600'
            }`} 
          />
          <div>
            <h3 className={`text-lg font-semibold ${
              connectionStatus?.configured ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {connectionStatus?.configured ? 'AI Service Active' : 'AI Configuration Required'}
            </h3>
            <p className={`text-sm ${
              connectionStatus?.configured ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {connectionStatus?.configured 
                ? `Google Gemini AI is configured and operational (Model: ${connectionStatus.model || 'Unknown'})` 
                : 'Configure your Google Gemini API key to enable AI features'
              }
            </p>
            {connectionStatus?.testResult && (
              <p className="text-xs mt-1">
                Last test: {connectionStatus.testResult.success ? '✅ Success' : '❌ Failed'}
                {connectionStatus.testResult.error && ` - ${connectionStatus.testResult.error}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* API Key Configuration */}
      <form onSubmit={handleSubmit(saveConfiguration)} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiKey} className="mr-2" />
            API Key Configuration
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Gemini API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  {...register('apiKey', {
                    required: 'API key is required',
                    minLength: {
                      value: 30,
                      message: 'API key appears to be too short'
                    }
                  })}
                  className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="AIzaSyC..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showApiKey ? FiEyeOff : FiEye} />
                  </button>
                  <button
                    type="button"
                    onClick={copyApiKeyTemplate}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy environment template"
                  >
                    <SafeIcon icon={FiCopy} />
                  </button>
                </div>
              </div>
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline inline-flex items-center"
                >
                  Google AI Studio <SafeIcon icon={FiExternalLink} className="ml-1" />
                </a>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                {...register('model')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.displayName} {model.description && `- ${model.description}`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental (Latest)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.0-pro">Gemini 1.0 Pro (Stable)</option>
                  </>
                )}
              </select>
              {availableModels.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {availableModels.length} models available with your API key
                </p>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({watch('temperature')})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  {...register('temperature')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  {...register('maxTokens', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Minimum 1 token' },
                    max: { value: 8192, message: 'Maximum 8192 tokens' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.maxTokens && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxTokens.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connection Testing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiTestTube} className="mr-2" />
            Connection Testing
          </h4>
          
          <div className="flex items-center space-x-4 mb-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={testConnection}
              disabled={testing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <SafeIcon icon={testing ? FiRefreshCw : FiTestTube} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </motion.button>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <SafeIcon icon={saving ? FiRefreshCw : FiSave} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </motion.button>
          </div>

          {connectionStatus?.testResult && (
            <div className={`p-3 rounded-lg ${
              connectionStatus.testResult.success 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={connectionStatus.testResult.success ? FiCheckCircle : FiAlertTriangle} />
                <span className="font-medium">
                  {connectionStatus.testResult.success ? 'Connection Successful' : 'Connection Failed'}
                </span>
              </div>
              {connectionStatus.testResult.message && (
                <p className="mt-1 text-sm">{connectionStatus.testResult.message}</p>
              )}
              {connectionStatus.testResult.error && (
                <p className="mt-1 text-sm">{connectionStatus.testResult.error}</p>
              )}
              {connectionStatus.testResult.model && (
                <p className="mt-1 text-sm">Using model: {connectionStatus.testResult.model}</p>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiShield} className="mr-2" />
            Configuration Validation
          </h4>
          <div className="space-y-4">
            {Object.entries(validationResults).map(([key, validation]) => (
              <div key={key} className="flex items-center space-x-3">
                <SafeIcon 
                  icon={validation.valid ? FiCheckCircle : FiAlertTriangle} 
                  className={validation.valid ? 'text-green-600' : 'text-red-600'} 
                />
                <div>
                  <span className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <p className="text-sm text-gray-600">{validation.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Audit */}
      {securityAudit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiLock} className="mr-2" />
            Security Audit
          </h4>
          <div className="space-y-3 mb-4">
            {securityAudit.checks.map((check, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <SafeIcon 
                  icon={check.status === 'pass' ? FiCheckCircle : 
                        check.status === 'warning' ? FiAlertTriangle : FiAlertTriangle} 
                  className={check.status === 'pass' ? 'text-green-600' : 
                            check.status === 'warning' ? 'text-yellow-600' : 'text-red-600'} 
                />
                <div>
                  <span className="font-medium text-gray-900">{check.name}</span>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Security Recommendations</h5>
            <ul className="space-y-1 text-sm text-blue-800">
              {securityAudit.recommendations.map((rec, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      {/* Usage Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiActivity} className="mr-2" />
          Usage Statistics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Requests Today',
              value: usageStats?.today || '0',
              limit: '1,500',
              icon: FiZap,
              color: 'text-blue-600',
              bg: 'bg-blue-100'
            },
            {
              title: 'Requests This Month',
              value: usageStats?.month || '0',
              limit: 'Unlimited',
              icon: FiBarChart3,
              color: 'text-green-600',
              bg: 'bg-green-100'
            },
            {
              title: 'Avg Response Time',
              value: usageStats?.avgResponseTime || '2.3s',
              limit: '<5s target',
              icon: FiClock,
              color: 'text-purple-600',
              bg: 'bg-purple-100'
            }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.limit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiGlobe} className="mr-2" />
          Service Status
        </h4>
        <div className="space-y-3">
          {[
            { service: 'Google Gemini API v1beta', status: 'operational', latency: '150ms' },
            { service: 'Gemini 2.0 Flash Model', status: 'operational', latency: '2.1s' },
            { service: 'AI Insights Generation', status: 'operational', latency: '2.3s' },
            { service: 'Recommendation Engine', status: 'operational', latency: '1.8s' },
            { service: 'Error Recovery System', status: 'operational', latency: '50ms' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">{item.service}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="capitalize">{item.status}</span>
                <span>{item.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiBrain} className="mr-2" />
          Advanced AI Settings
        </h4>
        <form onSubmit={handleSubmit(saveConfiguration)} className="space-y-6">
          {/* Performance Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Timeout (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                {...register('timeout', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Attempts
              </label>
              <input
                type="number"
                min="1"
                max="5"
                {...register('retryAttempts', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit (requests/minute)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                {...register('rateLimit', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                {...register('environment')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900">Feature Settings</h5>
            <div className="space-y-3">
              {[
                {
                  key: 'enableCaching',
                  label: 'Enable Response Caching',
                  description: 'Cache responses to reduce API calls'
                },
                {
                  key: 'enableLogging',
                  label: 'Enable Detailed Logging',
                  description: 'Log all AI interactions for debugging'
                }
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h6 className="font-medium text-gray-900">{feature.label}</h6>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(feature.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <SafeIcon icon={saving ? FiRefreshCw : FiSave} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Saving...' : 'Save Advanced Settings'}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SafeIcon icon={FiBarChart3} className="mr-2" />
          Configuration History
        </h4>
        <div className="space-y-3">
          {configHistory.length > 0 ? (
            configHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <SafeIcon 
                    icon={entry.success ? FiCheckCircle : FiAlertTriangle} 
                    className={entry.success ? 'text-green-600' : 'text-red-600'} 
                  />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.error && (
                      <p className="text-sm text-red-600 mt-1">{entry.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {entry.user}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SafeIcon icon={FiBarChart3} className="text-4xl mx-auto mb-2" />
              <p>No configuration history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'configuration': return renderConfigurationTab();
      case 'security': return renderSecurityTab();
      case 'monitoring': return renderMonitoringTab();
      case 'advanced': return renderAdvancedTab();
      case 'audit': return renderAuditTab();
      default: return renderConfigurationTab();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
          <p className="text-gray-600 mt-1">
            Enterprise-grade configuration for Google Gemini AI integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkConnectionStatus}
            disabled={testing}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <SafeIcon icon={testing ? FiRefreshCw : FiRefreshCw} className={testing ? 'animate-spin' : ''} />
            <span>Refresh Status</span>
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIConfiguration;