import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLoginAsUserStore } from '../../../stores/loginAsUserStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEye, FiUser, FiClock, FiActivity, FiSearch, FiFilter, FiDownload, FiAlertTriangle } = FiIcons;

const ImpersonationAuditLog = () => {
  const { getAuditLog, cleanupAuditLog } = useLoginAsUserStore();
  const [auditLog, setAuditLog] = useState([]);
  const [filters, setFilters] = useState({
    adminId: '',
    targetUserId: '',
    startDate: '',
    endDate: '',
    type: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLog();
    cleanupAuditLog();
  }, [filters]);

  const loadAuditLog = () => {
    const log = getAuditLog(filters);
    setAuditLog(log);
  };

  const filteredLog = auditLog.filter(entry => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.adminEmail?.toLowerCase().includes(searchLower) ||
      entry.targetUserEmail?.toLowerCase().includes(searchLower) ||
      entry.action?.toLowerCase().includes(searchLower) ||
      entry.details?.toLowerCase().includes(searchLower)
    );
  });

  const getEventTypeColor = (type) => {
    const colors = {
      'IMPERSONATION_START': 'bg-blue-100 text-blue-800',
      'IMPERSONATION_ACTION': 'bg-yellow-100 text-yellow-800',
      'IMPERSONATION_END': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getEventIcon = (type) => {
    const icons = {
      'IMPERSONATION_START': FiEye,
      'IMPERSONATION_ACTION': FiActivity,
      'IMPERSONATION_END': FiUser
    };
    return icons[type] || FiActivity;
  };

  const exportAuditLog = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Admin', 'Target User', 'Action', 'Details', 'Session ID'],
      ...filteredLog.map(entry => [
        entry.timestamp,
        entry.type,
        entry.adminEmail,
        entry.targetUserEmail,
        entry.action || '',
        entry.details || '',
        entry.sessionId
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `impersonation_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impersonation Audit Log</h1>
          <p className="text-gray-600 mt-1">
            Complete audit trail of all login-as-user activities
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportAuditLog}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
        >
          <SafeIcon icon={FiDownload} />
          <span>Export CSV</span>
        </motion.button>
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-50 border border-orange-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiAlertTriangle} className="text-orange-600 text-xl mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900">Security & Compliance</h3>
            <p className="text-orange-800 mt-1">
              All impersonation activities are logged for security and compliance purposes. 
              This log includes detailed information about admin actions performed while logged in as other users.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-orange-100 rounded-lg p-3">
                <p className="font-medium text-orange-900">Retention Period</p>
                <p className="text-orange-800">90 days</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <p className="font-medium text-orange-900">Access Level</p>
                <p className="text-orange-800">Agency Admins Only</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <p className="font-medium text-orange-900">Compliance</p>
                <p className="text-orange-800">SOC 2, GDPR Ready</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emails, actions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="IMPERSONATION_START">Session Start</option>
              <option value="IMPERSONATION_ACTION">Actions</option>
              <option value="IMPERSONATION_END">Session End</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Entries ({filteredLog.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action/Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLog.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={getEventIcon(entry.type)} className="text-gray-500" />
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(entry.type)}`}>
                        {entry.type.replace('IMPERSONATION_', '').replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.adminEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.targetUserEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      {entry.action && <p className="font-medium">{entry.action}</p>}
                      {entry.details && <p className="text-gray-600">{entry.details}</p>}
                      {entry.reason && <p className="text-gray-500 text-xs">Reason: {entry.reason}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {entry.sessionId?.slice(-8)}...
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLog.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiActivity} className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Entries Found</h3>
            <p className="text-gray-600">No impersonation activities match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpersonationAuditLog;