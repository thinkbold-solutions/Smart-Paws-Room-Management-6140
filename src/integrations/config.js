// Integration configuration
export const INTEGRATION_CONFIG = {
  // Namespace for Smart Paws
  namespace: 'smart-paws',
  
  // Route prefix
  routePrefix: '/smart-paws',
  
  // CSS class prefix
  cssPrefix: 'sp-',
  
  // Local storage prefix
  storagePrefix: 'smartpaws_',
  
  // Database table prefix
  tablePrefix: 'sp_',
  
  // Feature flags
  features: {
    standalone: process.env.REACT_APP_SMARTPAWS_STANDALONE === 'true',
    integration: process.env.REACT_APP_SMARTPAWS_INTEGRATION === 'true'
  },
  
  // External integration settings
  external: {
    authProvider: process.env.REACT_APP_EXTERNAL_AUTH_PROVIDER,
    userMapping: {
      id: 'id',
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role'
    }
  }
};

// Safe environment variable access
export const getEnvVar = (key, defaultValue = '') => {
  return import.meta.env[key] || process.env[key] || defaultValue;
};

// Integration utilities
export const prefixedStorageKey = (key) => {
  return `${INTEGRATION_CONFIG.storagePrefix}${key}`;
};

export const prefixedTableName = (tableName) => {
  return `${INTEGRATION_CONFIG.tablePrefix}${tableName}`;
};

export const prefixedClassName = (className) => {
  return `${INTEGRATION_CONFIG.cssPrefix}${className}`;
};