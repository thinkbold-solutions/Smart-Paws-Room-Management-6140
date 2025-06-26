import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import ClinicOverview from './clinic-admin/ClinicOverview';
import RoomManagement from './clinic-admin/RoomManagement';
import StaffManagement from './clinic-admin/StaffManagement';
import Analytics from './clinic-admin/Analytics';
import Settings from './clinic-admin/Settings';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiGrid, FiUsers, FiBarChart3, FiSettings, FiClock, FiCalendar } = FiIcons;

const ClinicAdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Updated navigation - removed settings as it's now focused on clinic-specific settings
  const navigation = [
    { name: 'Overview', href: '/clinic-admin', icon: FiHome },
    { name: 'Room Management', href: '/clinic-admin/rooms', icon: FiGrid },
    { name: 'Appointments', href: '/clinic-admin/appointments', icon: FiCalendar },
    { name: 'Staff', href: '/clinic-admin/staff', icon: FiUsers },
    { name: 'Analytics', href: '/clinic-admin/analytics', icon: FiBarChart3 },
    { name: 'Timers', href: '/clinic-admin/timers', icon: FiClock },
    { name: 'Clinic Settings', href: '/clinic-admin/settings', icon: FiSettings }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar navigation={navigation} isCollapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Clinic Administration" 
          subtitle="Room & Staff Management" 
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Routes are relative to /clinic-admin/ */}
            <Routes>
              <Route index element={<ClinicOverview />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="appointments" element={
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Appointments Coming Soon</h2>
                  <p className="text-gray-600 mt-2">Appointment management features will be available soon.</p>
                </div>
              } />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="timers" element={
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Room Timers Coming Soon</h2>
                  <p className="text-gray-600 mt-2">Room timer features will be available soon.</p>
                </div>
              } />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClinicAdminDashboard;