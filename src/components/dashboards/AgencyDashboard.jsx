import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import AgencyOverview from './agency/AgencyOverview';
import ClinicManagement from './agency/ClinicManagement';
import UserManagement from './agency/UserManagement';
import UserRoleManagement from './agency/UserRoleManagement';
import AIInsights from './agency/AIInsights';
import AIConfiguration from './agency/AIConfiguration';
import PredictiveAnalytics from '../analytics/PredictiveAnalytics';
import AnalyticsOverview from '../analytics/AnalyticsOverview';
import Settings from './agency/Settings';
import Integrations from './agency/Integrations';
import ImpersonationAuditLog from './agency/ImpersonationAuditLog';
import GHLIntegration from './agency/GHLIntegration';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiBuilding, FiUsers, FiShield, FiBrain, FiSettings, FiBarChart3, FiTrendingUp, FiActivity, FiDatabase, FiEye, FiLink } = FiIcons;

const AgencyDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/agency', icon: FiHome },
    { name: 'Clinic Management', href: '/agency/clinics', icon: FiBuilding },
    { name: 'User Management', href: '/agency/users', icon: FiUsers },
    { name: 'User Roles', href: '/agency/user-roles', icon: FiShield },
    { name: 'AI Insights', href: '/agency/ai-insights', icon: FiBrain },
    { name: 'AI Configuration', href: '/agency/ai-config', icon: FiSettings },
    { name: 'Predictive Analytics', href: '/agency/predictive', icon: FiTrendingUp },
    { name: 'Analytics Overview', href: '/agency/analytics', icon: FiBarChart3 },
    { name: 'Integrations', href: '/agency/integrations', icon: FiDatabase },
    { name: 'GHL Integration', href: '/agency/ghl-integration', icon: FiLink },
    { name: 'Audit Log', href: '/agency/audit-log', icon: FiEye },
    { name: 'Settings', href: '/agency/settings', icon: FiSettings }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar navigation={navigation} isCollapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Agency Dashboard" subtitle="Multi-Clinic Management" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route index element={<AgencyOverview />} />
              <Route path="clinics" element={<ClinicManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="user-roles" element={<UserRoleManagement />} />
              <Route path="ai-insights" element={<AIInsights />} />
              <Route path="ai-config" element={<AIConfiguration />} />
              <Route path="predictive" element={<PredictiveAnalytics />} />
              <Route path="analytics" element={<AnalyticsOverview />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="ghl-integration" element={<GHLIntegration />} />
              <Route path="audit-log" element={<ImpersonationAuditLog />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyDashboard;