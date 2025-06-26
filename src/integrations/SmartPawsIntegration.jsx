import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SmartPawsProvider } from './SmartPawsProvider';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load Smart Paws components to avoid bundle conflicts
const SmartPawsApp = lazy(() => import('../App'));

const SmartPawsIntegration = ({ user, onError }) => {
  const handleError = (error, errorInfo) => {
    console.error('Smart Paws Integration Error:', error, errorInfo);
    onError?.(error);
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Smart Paws Unavailable
          </h2>
          <p className="text-gray-600">
            The veterinary management system is temporarily unavailable.
          </p>
        </div>
      }
      onError={handleError}
    >
      <div className="smart-paws-integration">
        <SmartPawsProvider existingUser={user}>
          <Suspense fallback={<LoadingSpinner message="Loading Smart Paws..." />}>
            <SmartPawsApp />
          </Suspense>
        </SmartPawsProvider>
      </div>
    </ErrorBoundary>
  );
};

export default SmartPawsIntegration;