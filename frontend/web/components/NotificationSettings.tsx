import React, { useState, useEffect } from 'react';
import { useFirebaseMessaging } from '../hooks/useFirebase';
import { BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { logger } from '../lib/productionLogger'

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const { fcmToken, isSupported, hasPermission, requestPermission, unregister } = useFirebaseMessaging();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (hasPermission) {
        // Disable notifications
        const success = await unregister();
        if (success) {
          toast.success('Push notifications disabled');
        } else {
          toast.error('Failed to disable notifications');
        }
      } else {
        // Enable notifications
        const success = await requestPermission();
        if (success) {
          toast.success('Push notifications enabled');
        } else {
          toast.error('Failed to enable notifications');
        }
      }
    } catch (error) {
      logger.error('ERROR', 'Error toggling notifications:', { error: error });
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636M2.5 2.5l19 19M7 21h10a2 2 0 002-2v-1a1.5 1.5 0 00-1.5-1.5v-3a6.5 6.5 0 00-13 0v3A1.5 1.5 0 003 17v1a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-yellow-800">
            Push notifications are not supported in this browser
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {hasPermission ? (
            <BellIcon className="h-5 w-5 text-green-600 mr-3" />
          ) : (
            <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="text-xs text-gray-500">
              {hasPermission 
                ? 'Get notified about workouts, achievements, and updates'
                : 'Enable notifications to stay updated'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggleNotifications}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${hasPermission 
              ? 'bg-blue-600' 
              : 'bg-gray-200'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${hasPermission ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {hasPermission && fcmToken && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;