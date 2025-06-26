import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OnBoarding } from '@questlabs/react-sdk';
import questConfig from '../../config/questConfig';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHeart, FiCheckCircle, FiUsers, FiSettings } = FiIcons;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const getAnswers = () => {
    // Navigate to main app after completion
    navigate('/agency');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex">
      {/* Left Section - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white">
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8"
          >
            <SafeIcon icon={FiSettings} className="text-4xl text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl font-bold mb-6"
          >
            Let's Get Started!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl text-emerald-100 max-w-md leading-relaxed mb-8"
          >
            We're setting up your Smart Paws experience. 
            This will only take a few minutes to customize everything for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 text-emerald-100">
              <SafeIcon icon={FiCheckCircle} className="text-xl" />
              <span>Personalized dashboard setup</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <SafeIcon icon={FiUsers} className="text-xl" />
              <span>Team preferences configuration</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <SafeIcon icon={FiHeart} className="text-xl" />
              <span>Optimized workflow recommendations</span>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-primary-400/20 rounded-full blur-md"></div>
      </div>

      {/* Right Section - Onboarding Component */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={FiSettings} className="text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
            <p className="text-gray-600">Let's customize your experience</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="quest-onboarding-container" style={{ width: '400px', maxWidth: '100%' }}>
              <OnBoarding
                userId={userId}
                token={token}
                questId={questConfig.QUEST_ONBOARDING_QUESTID}
                answer={answers}
                setAnswer={setAnswers}
                getAnswers={getAnswers}
                accent={questConfig.PRIMARY_COLOR}
                singleChoose="modal1"
                multiChoice="modal2"
                styles={{
                  container: {
                    width: '100%',
                    maxWidth: '400px'
                  }
                }}
              >
                <OnBoarding.Header />
                <OnBoarding.Content />
                <OnBoarding.Footer />
              </OnBoarding>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <button className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                Contact support
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;