import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from './SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHeart, FiUser, FiLogOut, FiSettings, FiChevronDown, FiBell } = FiIcons;

const Header = ({ title, subtitle }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut, selectedClinic } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'agency_admin': 'Agency Administrator',
      'agency_user': 'Agency User',
      'clinic_admin': 'Clinic Administrator',
      'clinic_user': 'Clinic User'
    };
    return roleMap[role] || role;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiHeart} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          
          {selectedClinic && (
            <div className="hidden md:block">
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {selectedClinic.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiBell} className="text-xl" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiUser} className="text-white text-sm" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">
                  {getRoleDisplayName(user?.role)}
                </p>
              </div>
              <SafeIcon icon={FiChevronDown} className="text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                >
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <SafeIcon icon={FiSettings} className="text-gray-400" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiLogOut} className="text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;