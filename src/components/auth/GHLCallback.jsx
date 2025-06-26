import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ghlApiService } from '../../services/ghlApiService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const GHLCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth Error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      setStatus('exchanging_token');
      
      // Exchange code for tokens
      const tokenData = await ghlApiService.exchangeCodeForToken(code, state);
      
      setStatus('discovering_locations');
      
      // Discover and store sub-accounts
      await ghlApiService.discoverSubAccounts();
      
      setStatus('success');
      
      toast.success('🎉 GoHighLevel connected successfully!');
      
      // Redirect to GHL integration page
      setTimeout(() => {
        navigate('/agency/ghl-integration');
      }, 2000);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      toast.error(`Connection failed: ${error.message}`);
      
      setTimeout(() => {
        navigate('/agency/ghl-integration');
      }, 3000);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Processing authorization...';
      case 'exchanging_token':
        return 'Exchanging authorization code...';
      case 'discovering_locations':
        return 'Discovering your GHL locations...';
      case 'success':
        return 'Successfully connected to GoHighLevel!';
      case 'error':
        return 'Connection failed. Redirecting...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connecting to GoHighLevel
          </h2>
          <p className="text-gray-600">
            {getStatusMessage()}
          </p>
        </div>
        
        {status !== 'error' && <LoadingSpinner size="medium" />}
        
        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Connection established successfully!
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ❌ Connection failed. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GHLCallback;