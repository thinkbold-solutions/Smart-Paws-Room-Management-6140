import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import SafeIcon from './SafeIcon';

const Sidebar = ({ navigation, isCollapsed = false }) => {
  const location = useLocation();

  const isActive = (path) => {
    // Exact match for index routes
    if (path === '/clinic-admin' || path === '/agency' || path === '/clinic') {
      return location.pathname === path;
    }
    // Prefix match for subroutes
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={item.href}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-800 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <SafeIcon
                icon={item.icon}
                className={clsx(
                  'flex-shrink-0',
                  isCollapsed ? 'text-xl' : 'text-lg mr-3'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          </motion.div>
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;