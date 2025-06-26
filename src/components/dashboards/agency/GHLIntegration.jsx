import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ghlApiService } from '../../../services/ghlApiService';
import { ghlSyncService } from '../../../services/ghlSyncService';
import { useAuthStore } from '../../../stores/authStore';
import supabase from '../../../lib/supabase';
import toast from 'react-hot-toast';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiRefreshCw, FiExternalLink, FiCheck, FiX, FiPlus, FiEye, FiMapPin, FiSync, FiDownload, FiUpload, FiActivity, FiUsers, FiClock, FiAlertCircle } = FiIcons;

const GHLIntegration = () => {
  const { user } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [subAccounts, setSubAccounts] = useState([]);
  const [clinicMappings, setClinicMappings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState({});
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedSubAccount, setSelectedSubAccount] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkConnectionStatus();
    loadSubAccounts();
    loadClinicMappings();
    loadClinics();
    loadSyncLogs();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const result = await ghlApiService.testConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ success: false, error: error.message });
    }
  };

  const loadClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('sp_clinics_live')
        .select('*')
        .eq('active', true);
      
      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Failed to load clinics:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ghl_sync_log')
        .select(`
          *,
          clinic_mapping:ghl_clinic_mappings(
            clinic:sp_clinics_live(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    }
  };

  // Enhanced connection handler for marketplace apps
  const initiateGHLConnection = () => {
    // Check if environment variables are configured
    if (!import.meta.env.VITE_GHL_CLIENT_ID || !import.meta.env.VITE_GHL_CLIENT_SECRET) {
      toast.error('GHL Marketplace App not configured. Please add your Client ID and Secret to environment variables.');
      return;
    }

    // Use the marketplace OAuth flow
    ghlApiService.initiateMarketplaceOAuth();
  };

  const discoverSubAccounts = async () => {
    setLoading(true);
    try {
      const accounts = await ghlApiService.discoverSubAccounts();
      setSubAccounts(accounts);
      toast.success(`Discovered ${accounts.length} GoHighLevel locations`);
    } catch (error) {
      toast.error('Failed to discover sub-accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('ghl_sub_accounts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSubAccounts(data || []);
    } catch (error) {
      console.error('Failed to load sub-accounts:', error);
    }
  };

  const loadClinicMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('ghl_clinic_mappings')
        .select(`
          *,
          clinic:sp_clinics_live(*),
          sub_account:ghl_sub_accounts(*)
        `);
      
      if (error) throw error;
      setClinicMappings(data || []);
    } catch (error) {
      console.error('Failed to load clinic mappings:', error);
    }
  };

  const createClinicMapping = async (subAccountId, clinicId) => {
    try {
      const { data, error } = await supabase
        .from('ghl_clinic_mappings')
        .insert({
          ghl_sub_account_id: subAccountId,
          clinic_id: clinicId,
          mapped_by: user.id,
          active: true,
        });
      
      if (error) throw error;
      
      toast.success('Clinic mapping created successfully');
      loadClinicMappings();
      setShowMappingModal(false);
    } catch (error) {
      toast.error('Failed to create clinic mapping: ' + error.message);
    }
  };

  const triggerSync = async (clinicId, direction = 'both') => {
    setSyncLoading(prev => ({ ...prev, [clinicId]: true }));
    try {
      const results = await ghlSyncService.triggerManualSync(clinicId, direction);
      toast.success(
        `Sync completed! Imported: ${results.imported}, Exported: ${results.exported}, Updated: ${results.updated}`,
        { duration: 6000 }
      );
      loadSyncLogs(); // Refresh sync logs
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    } finally {
      setSyncLoading(prev => ({ ...prev, [clinicId]: false }));
    }
  };

  const renderConnectionStatus = () => (
    <div className={`rounded-lg p-4 border-2 ${connectionStatus?.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center space-x-3">
        <SafeIcon icon={connectionStatus?.success ? FiCheck : FiX} className={`text-2xl ${connectionStatus?.success ? 'text-green-600' : 'text-red-600'}`} />
        <div>
          <h3 className={`text-lg font-semibold ${connectionStatus?.success ? 'text-green-900' : 'text-red-900'}`}>
            {connectionStatus?.success ? 'GoHighLevel Connected' : 'GoHighLevel Not Connected'}
          </h3>
          <p className={`text-sm ${connectionStatus?.success ? 'text-green-800' : 'text-red-800'}`}>
            {connectionStatus?.success 
              ? 'Your agency is connected to GoHighLevel and ready for contact sync' 
              : connectionStatus?.error || 'Connect your GoHighLevel account to enable integration'
            }
          </p>
        </div>
      </div>
      {!connectionStatus?.success && (
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={initiateGHLConnection}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <SafeIcon icon={FiExternalLink} />
            <span>Connect GoHighLevel Marketplace App</span>
          </motion.button>
          
          {/* Configuration Help */}
          {(!import.meta.env.VITE_GHL_CLIENT_ID || !import.meta.env.VITE_GHL_CLIENT_SECRET) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Configuration Required:</p>
                  <p className="text-yellow-700 mt-1">
                    Add your GHL Marketplace App credentials to environment variables:
                  </p>
                  <div className="mt-2 bg-yellow-100 rounded p-2 font-mono text-xs">
                    VITE_GHL_CLIENT_ID=your-client-id<br />
                    VITE_GHL_CLIENT_SECRET=your-client-secret<br />
                    VITE_GHL_REDIRECT_URI=https://yourdomain.com/agency/ghl-callback
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {renderConnectionStatus()}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Connected Locations', value: subAccounts.length, icon: FiMapPin, color: 'text-blue-600' },
          { title: 'Active Mappings', value: clinicMappings.filter(m => m.active).length, icon: FiSync, color: 'text-green-600' },
          { title: 'Recent Syncs', value: syncLogs.filter(log => {
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return new Date(log.created_at) > dayAgo;
          }).length, icon: FiActivity, color: 'text-orange-600' },
          { title: 'Total Clinics', value: clinics.length, icon: FiUsers, color: 'text-purple-600' }
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
              <div className={`${stat.color} p-3 rounded-lg bg-gray-50`}>
                <SafeIcon icon={stat.icon} className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Clinic Mappings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Clinic Mappings ({clinicMappings.filter(m => m.active).length})
        </h3>
        {clinicMappings.filter(m => m.active).length > 0 ? (
          <div className="space-y-3">
            {clinicMappings.filter(m => m.active).map((mapping) => (
              <div key={mapping.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{mapping.clinic.name}</p>
                  <p className="text-sm text-gray-600">
                    ↔ {mapping.sub_account.name} ({mapping.sub_account.business_name})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {mapping.sub_account.last_synced 
                      ? new Date(mapping.sub_account.last_synced).toLocaleString() 
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => triggerSync(mapping.clinic_id, 'import')}
                    disabled={syncLoading[mapping.clinic_id]}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SafeIcon icon={syncLoading[mapping.clinic_id] ? FiRefreshCw : FiDownload} className={syncLoading[mapping.clinic_id] ? 'animate-spin' : ''} />
                    <span>Import</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => triggerSync(mapping.clinic_id, 'export')}
                    disabled={syncLoading[mapping.clinic_id]}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SafeIcon icon={syncLoading[mapping.clinic_id] ? FiRefreshCw : FiUpload} className={syncLoading[mapping.clinic_id] ? 'animate-spin' : ''} />
                    <span>Export</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => triggerSync(mapping.clinic_id, 'both')}
                    disabled={syncLoading[mapping.clinic_id]}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SafeIcon icon={syncLoading[mapping.clinic_id] ? FiRefreshCw : FiSync} className={syncLoading[mapping.clinic_id] ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <SafeIcon icon={FiMapPin} className="text-3xl mx-auto mb-2" />
            <p>No active clinic mappings found</p>
            <p className="text-sm mt-1">Create mappings in the Locations tab</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          GoHighLevel Locations ({subAccounts.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={discoverSubAccounts}
          disabled={loading || !connectionStatus?.success}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <SafeIcon icon={loading ? FiRefreshCw : FiRefreshCw} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Discovering...' : 'Discover Locations'}</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subAccounts.map((account) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{account.name}</h4>
                <p className="text-sm text-gray-600">{account.business_name}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {account.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <SafeIcon icon={FiMapPin} className="mr-2" />
                <span>{account.city}, {account.state}</span>
              </div>
              <div>Phone: {account.phone || 'Not provided'}</div>
              <div>Email: {account.email || 'Not provided'}</div>
            </div>

            {/* Show if already mapped */}
            {clinicMappings.find(m => m.ghl_sub_account_id === account.id) ? (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                <span className="text-green-800 text-sm font-medium">
                  ✓ Mapped to {clinicMappings.find(m => m.ghl_sub_account_id === account.id)?.clinic?.name}
                </span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSubAccount(account);
                  setShowMappingModal(true);
                }}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiPlus} />
                <span>Map to Clinic</span>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {subAccounts.length === 0 && (
        <div className="text-center py-8">
          <SafeIcon icon={FiSettings} className="text-4xl text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Locations Found</h4>
          <p className="text-gray-600 mb-4">
            {connectionStatus?.success 
              ? 'Click "Discover Locations" to find your GoHighLevel locations'
              : 'Connect to GoHighLevel first to discover locations'
            }
          </p>
        </div>
      )}

      {/* Mapping Modal */}
      {showMappingModal && selectedSubAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Map Location to Clinic</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="font-medium">{selectedSubAccount.name}</p>
              <p className="text-sm text-gray-600">{selectedSubAccount.business_name}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Clinic:
              </label>
              <select
                id="clinic-select"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Choose a clinic...</option>
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMappingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const clinicId = document.getElementById('clinic-select').value;
                  if (clinicId) {
                    createClinicMapping(selectedSubAccount.id, clinicId);
                  }
                }}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Create Mapping
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderSyncLogsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Sync Activity Log ({syncLogs.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadSyncLogs}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiRefreshCw} />
          <span>Refresh</span>
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clinic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sync Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {log.clinic_mapping?.clinic?.name || 'Unknown Clinic'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-gray-700">{log.sync_type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.sync_data?.results ? (
                      <div>
                        ↓ {log.sync_data.results.imported || 0} imported, ↑ {log.sync_data.results.exported || 0} exported
                      </div>
                    ) : (
                      'No data'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {syncLogs.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiActivity} className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sync Activity</h3>
            <p className="text-gray-600">Sync logs will appear here once you start syncing contacts.</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiActivity },
    { id: 'locations', name: 'Locations', icon: FiMapPin },
    { id: 'sync-logs', name: 'Sync Logs', icon: FiClock }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GoHighLevel Integration</h1>
          <p className="text-gray-600 mt-1">
            Connect and sync your veterinary clinics with GoHighLevel sub-accounts
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'locations' && renderLocationsTab()}
            {activeTab === 'sync-logs' && renderSyncLogsTab()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GHLIntegration;