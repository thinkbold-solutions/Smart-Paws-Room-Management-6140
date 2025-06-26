import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDatabase, FiExternalLink, FiCopy, FiCheck, FiAlertTriangle, FiArrowRight } = FiIcons;

const SupabaseSetupGuide = ({ onComplete }) => {
  const [copiedStep, setCopiedStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const copyToClipboard = (text, stepId) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const markStepComplete = (stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const sqlSetup = `-- Create Organizations Table
CREATE TABLE IF NOT EXISTS sp_organizations_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Clinics Table
CREATE TABLE IF NOT EXISTS sp_clinics_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES sp_organizations_live(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS sp_users_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES sp_organizations_live(id),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  auth_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'clinic_user',
  status TEXT DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Rooms Table
CREATE TABLE IF NOT EXISTS sp_rooms_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES sp_clinics_live(id),
  room_number TEXT NOT NULL,
  room_name TEXT,
  room_type TEXT DEFAULT 'examination',
  status TEXT DEFAULT 'available',
  capacity INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other tables and setup...
-- (See full SQL in SUPABASE_SETUP_GUIDE.md)

-- Enable RLS and create policies
ALTER TABLE sp_organizations_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_clinics_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_users_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_rooms_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON sp_organizations_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_clinics_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_users_live FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sp_rooms_live FOR ALL USING (true);`;

  const steps = [
    {
      id: 'create-project',
      title: 'Create Supabase Project',
      description: 'Sign up and create a new project at Supabase',
      action: 'Go to Supabase',
      link: 'https://supabase.com',
      icon: FiExternalLink
    },
    {
      id: 'get-credentials',
      title: 'Get Your Credentials',
      description: 'Copy your Project URL and anon key from Settings > API',
      action: 'Open Settings',
      copyText: 'Go to your Supabase dashboard > Settings > API',
      icon: FiCopy
    },
    {
      id: 'update-config',
      title: 'Update Configuration',
      description: 'Update src/lib/supabase.js with your credentials',
      copyText: `const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'`,
      icon: FiCopy
    },
    {
      id: 'run-sql',
      title: 'Create Database Tables',
      description: 'Run the SQL setup in your Supabase SQL Editor',
      copyText: sqlSetup,
      icon: FiCopy
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiDatabase} className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Supabase Setup Required</h1>
              <p className="text-blue-100 mt-2">Let's connect Smart Paws to your database</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SafeIcon icon={FiAlertTriangle} className="text-amber-600 text-xl mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-900">Database Not Connected</h3>
                  <p className="text-amber-800 text-sm mt-1">
                    Smart Paws needs a Supabase database to store your clinic data. 
                    Follow these steps to get started (takes ~5 minutes).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-xl p-6 transition-all ${
                  completedSteps.has(step.id)
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    completedSteps.has(step.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {completedSteps.has(step.id) ? (
                      <SafeIcon icon={FiCheck} className="text-xl" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    
                    <div className="flex space-x-3">
                      {step.link && (
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2"
                          onClick={() => markStepComplete(step.id)}
                        >
                          <SafeIcon icon={step.icon} />
                          <span>{step.action}</span>
                        </motion.a>
                      )}
                      
                      {step.copyText && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            copyToClipboard(step.copyText, step.id);
                            markStepComplete(step.id);
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <SafeIcon icon={copiedStep === step.id ? FiCheck : FiCopy} />
                          <span>{copiedStep === step.id ? 'Copied!' : 'Copy Code'}</span>
                        </motion.button>
                      )}
                      
                      {!completedSteps.has(step.id) && (
                        <button
                          onClick={() => markStepComplete(step.id)}
                          className="text-green-600 hover:text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiCheck} />
                          <span>Mark Complete</span>
                        </button>
                      )}
                    </div>
                    
                    {step.copyText && step.id === 'run-sql' && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Tip:</strong> Copy this SQL and paste it into your Supabase SQL Editor
                        </p>
                        <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                          {sqlSetup.substring(0, 300)}...
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Complete Setup */}
          {completedSteps.size === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <SafeIcon icon={FiCheck} className="text-4xl text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Setup Complete!
                </h3>
                <p className="text-green-800 mb-4">
                  Now refresh the page to connect to your database.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2 mx-auto"
                >
                  <SafeIcon icon={FiArrowRight} />
                  <span>Refresh & Connect</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Help */}
          <div className="mt-8 text-center text-gray-600">
            <p className="text-sm">
              Need help? Check the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                detailed setup guide
              </a>{' '}
              or contact support.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupabaseSetupGuide;