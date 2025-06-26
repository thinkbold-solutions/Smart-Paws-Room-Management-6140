import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const SmartPawsContext = createContext();

export const SmartPawsProvider = ({ children, existingUser }) => {
  const { user, initialize, setExternalUser } = useAuthStore();

  useEffect(() => {
    if (existingUser && !user) {
      // Integrate with existing user system
      setExternalUser(existingUser);
    } else if (!existingUser) {
      // Use Smart Paws standalone auth
      initialize();
    }
  }, [existingUser, user, initialize, setExternalUser]);

  const contextValue = {
    user: user || existingUser,
    isIntegrated: !!existingUser,
    smartPawsUser: user
  };

  return (
    <SmartPawsContext.Provider value={contextValue}>
      {children}
    </SmartPawsContext.Provider>
  );
};

export const useSmartPawsContext = () => {
  const context = useContext(SmartPawsContext);
  if (!context) {
    throw new Error('useSmartPawsContext must be used within SmartPawsProvider');
  }
  return context;
};