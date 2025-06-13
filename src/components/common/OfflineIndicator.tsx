import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { offlineService } from '../../services/offlineService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(offlineService.isOnline());
  const [isVisible, setIsVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle sync
  const handleSync = useCallback(async () => {
    if (!isOnline) {
      console.log('Cannot sync while offline');
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log('Starting sync process...');
      await offlineService.sync();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
      
      // Hide indicator after successful sync
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  }, [isOnline]);

  useEffect(() => {
    // Update state when online status changes
    const unsubscribe = offlineService.addNetworkStatusListener((online) => {
      setIsOnline(online);
      setIsVisible(!online);
      
      // When going back online, try to sync
      if (online) {
        handleSync();
      }
    });

    // Show indicator if offline on mount
    setIsVisible(!isOnline);
    
    return () => {
      unsubscribe();
    };
  }, [handleSync, isOnline]);

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('Retry button clicked, checking network status...');
    const online = await offlineService.refreshNetworkStatus();
    console.log('Network status check result:', online);
    setIsOnline(online);
    
    if (online) {
      console.log('Network is online, attempting to sync...');
      handleSync();
    } else {
      console.log('Still offline, sync will be attempted when connection is restored');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-white ${
            isOnline ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center">
              {isOnline ? (
                <>
                  <WifiIcon className="h-5 w-5 mr-2" />
                  <span>
                    {isSyncing 
                      ? 'Syncing your changes...' 
                      : 'Back online! Your changes have been synced.'}
                  </span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  <span>You're offline. Changes will sync when connection is restored.</span>
                </>
              )}
            </div>
            
            {!isOnline && (
              <button
                onClick={handleRefresh}
                className="ml-2 px-2 py-1 text-xs bg-white text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Retry
              </button>
            )}
            
            {isOnline && (
              <button
                onClick={() => setIsVisible(false)}
                className="ml-2 px-2 py-1 text-xs bg-white text-green-600 rounded hover:bg-green-100 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}