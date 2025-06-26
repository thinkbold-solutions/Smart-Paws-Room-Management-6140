import { useState, useEffect } from 'react';
import { INTEGRATION_CONFIG } from '../integrations/config';

export const useIntegration = () => {
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [externalUser, setExternalUser] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState('initializing');

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      // Check if running in integrated mode
      const integrated = INTEGRATION_CONFIG.features.integration;
      setIsIntegrated(integrated);

      if (integrated) {
        // Try to get user from parent application
        const user = await getExternalUser();
        setExternalUser(user);
      }

      setIntegrationStatus('ready');
    } catch (error) {
      console.error('Integration check failed:', error);
      setIntegrationStatus('error');
    }
  };

  const getExternalUser = async () => {
    // This would be implemented based on your existing auth system
    if (window.parent && window.parent !== window) {
      // Running in iframe or embedded context
      return new Promise((resolve) => {
        window.parent.postMessage({ type: 'GET_USER' }, '*');
        
        const handleMessage = (event) => {
          if (event.data.type === 'USER_DATA') {
            window.removeEventListener('message', handleMessage);
            resolve(event.data.user);
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          resolve(null);
        }, 5000);
      });
    }
    
    return null;
  };

  const sendMessageToParent = (type, data) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, data }, '*');
    }
  };

  return {
    isIntegrated,
    externalUser,
    integrationStatus,
    sendMessageToParent
  };
};