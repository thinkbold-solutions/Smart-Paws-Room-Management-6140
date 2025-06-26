import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLoginAsUserStore } from '../../stores/loginAsUserStore';
import SafeIcon from './SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEye, FiUser, FiLogOut, FiClock } = FiIcons;

const ImpersonationBanner = () => {
  const navigate = useNavigate();
  const { 
    isImpersonating, 
    originalAdmin, 
    targetUser, 
    impersonationSession, 
    endImpersonation 
  } = useLoginAsUserStore();

  if (!isImpersonating || !originalAdmin || !targetUser) {
    return null;
  }

  const handleReturnToAdmin = async () => {
    try {
      // End impersonation session
      await endImpersonation();
      
      // Use React Router navigate instead of window.location
      navigate('/agency', { replace: true });
      
      // Force a page reload to clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error ending impersonation:', error);
      // Fallback: navigate to agency dashboard
      navigate('/agency', { replace: true });
    }
  };

  const getSessionDuration = () => {
    if (!impersonationSession?.startTime) return '0m';
    
    const startTime = new Date(impersonationSession.startTime);
    const currentTime = new Date();
    const diffMs = currentTime - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg border-b-4 border-red-600 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiEye} className="text-xl animate-pulse" />
              <span className="font-bold text-lg">ADMIN IMPERSONATION MODE</span>
            </div>
            
            <div className="h-6 w-px bg-white/30"></div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiUser} className="text-sm" />
                <div className="text-sm">
                  <span className="opacity-90">Viewing as: </span>
                  <span className="font-semibold">
                    {targetUser.firstName} {targetUser.lastName}
                  </span>
                  <span className="opacity-75 ml-1">({targetUser.email})</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiClock} className="text-sm" />
                <div className="text-sm">
                  <span className="opacity-90">Session: </span>
                  <span className="font-semibold">{getSessionDuration()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <div className="opacity-90">Admin:</div>
              <div className="font-semibold">{originalAdmin.firstName} {originalAdmin.lastName}</div>
            </div>
            
            <div className="h-6 w-px bg-white/30"></div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReturnToAdmin}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all"
            >
              <SafeIcon icon={FiLogOut} />
              <span>Return to Admin</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Pulsing indicator */}
      <div className="absolute left-0 top-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-400 opacity-50">
        <div className="h-full bg-white animate-pulse opacity-30"></div>
      </div>
    </motion.div>
  );
};

export default ImpersonationBanner;