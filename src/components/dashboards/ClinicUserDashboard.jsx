import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import UserOverview from './clinic-user/UserOverview';
import RoomBoard from './clinic-user/RoomBoard';
import WaitingQueue from './clinic-user/WaitingQueue';
import MyAssignments from './clinic-user/MyAssignments';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiGrid, FiUsers, FiClock, FiUser, FiCalendar } = FiIcons;

const ClinicUserDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/clinic', icon: FiHome },
    { name: 'Room Board', href: '/clinic/rooms', icon: FiGrid },
    { name: 'Waiting Queue', href: '/clinic/waiting', icon: FiUsers, badge: '3' },
    { name: 'My Assignments', href: '/clinic/assignments', icon: FiUser },
    { name: 'Schedule', href: '/clinic/schedule', icon: FiCalendar },
    { name: 'Timers', href: '/clinic/timers', icon: FiClock },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar navigation={navigation} isCollapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Clinic Dashboard" subtitle="Room Operations" />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route index element={<UserOverview />} />
              <Route path="rooms" element={<RoomBoard />} />
              <Route path="waiting" element={<WaitingQueue />} />
              <Route path="assignments" element={<MyAssignments />} />
              <Route path="schedule" element={
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule Coming Soon</h2>
                  <p className="text-gray-600 mt-2">Schedule management features will be available soon.</p>
                </div>
              } />
              <Route path="timers" element={
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900">Active Timers Coming Soon</h2>
                  <p className="text-gray-600 mt-2">Timer features will be available soon.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClinicUserDashboard;