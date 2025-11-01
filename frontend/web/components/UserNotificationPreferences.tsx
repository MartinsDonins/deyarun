// User Notification Preferences Component
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../utils/auth';
import { logger } from '../lib/productionLogger'
import { 
  BellIcon, 
  BellSlashIcon,
  CogIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  BookOpenIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { webPushService } from '../lib/webPushService';

interface UserNotificationPreferences {
  notificationsEnabled: boolean;
  workoutReminders: boolean;
  achievementAlerts: boolean;
  courseUpdates: boolean;
  weeklyProgress: boolean;
  socialUpdates: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const UserNotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    notificationsEnabled: true,
    workoutReminders: true,
    achievementAlerts: true,
    courseUpdates: true,
    weeklyProgress: true,
    socialUpdates: false,
    systemUpdates: true,
    emailNotifications: true,
    pushNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [hasWebPushSupport, setHasWebPushSupport] = useState(false);
  const [webPushPermission, setWebPushPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    loadPreferences();
    checkWebPushSupport();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPreferences(result.data);
        }
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load notification preferences:', { error: error });
      toast.error('Failed to load preferences');
    }
  };

  const checkWebPushSupport = async () => {
    const isSupported = webPushService.isSupported();
    setHasWebPushSupport(isSupported);
    
    if (isSupported) {
      const hasPermission = await webPushService.hasPermission();
      setWebPushPermission(hasPermission ? 'granted' : 'default');
    }
  };

  const updatePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(preferences)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Notification preferences updated');
        
        // Handle web push notification changes
        if (preferences.pushNotifications && hasWebPushSupport) {
          if (webPushPermission !== 'granted') {
            const enabled = await webPushService.enableNotifications();
            if (enabled) {
              setWebPushPermission('granted');
              toast.success('Web push notifications enabled');
            }
          }
        } else if (!preferences.pushNotifications && webPushPermission === 'granted') {
          await webPushService.disableNotifications();
          setWebPushPermission('default');
          toast.success('Web push notifications disabled');
        }
      } else {
        toast.error(result.message || 'Failed to update preferences');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to update preferences:', { error: error });
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoadingTest(true);
    try {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test notification sent');
      } else {
        toast.error(result.message || 'Failed to send test notification');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to send test notification:', { error: error });
      toast.error('Failed to send test notification');
    } finally {
      setLoadingTest(false);
    }
  };

  const updatePreference = (key: keyof UserNotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateQuietHours = (key: 'enabled' | 'start' | 'end', value: any) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BellIcon className="h-6 w-6 mr-2 text-coral-500" />
          Notification Preferences
        </h2>
        <p className="text-gray-600 mt-1">
          Manage how you receive notifications from DeyaRun
        </p>
      </div>

      {/* Master Switch */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {preferences.notificationsEnabled ? (
              <BellIcon className="h-8 w-8 text-coral-500 mr-4" />
            ) : (
              <BellSlashIcon className="h-8 w-8 text-gray-400 mr-4" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                All Notifications
              </h3>
              <p className="text-sm text-gray-500">
                Master switch for all notification types
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notificationsEnabled}
              onChange={(e) => updatePreference('notificationsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
          </label>
        </div>
      </div>

      {/* Notification Types */}
      {preferences.notificationsEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-coral-500" />
              Content Notifications
            </h3>

            <div className="space-y-4">
              {/* Workout Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Workout Reminders</div>
                    <div className="text-xs text-gray-500">Get reminded about scheduled workouts</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.workoutReminders}
                    onChange={(e) => updatePreference('workoutReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* Achievement Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrophyIcon className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Achievements</div>
                    <div className="text-xs text-gray-500">New achievements and milestones</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.achievementAlerts}
                    onChange={(e) => updatePreference('achievementAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* Course Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Course Updates</div>
                    <div className="text-xs text-gray-500">New lessons and course content</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.courseUpdates}
                    onChange={(e) => updatePreference('courseUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* Weekly Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Weekly Progress</div>
                    <div className="text-xs text-gray-500">Weekly summaries and statistics</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.weeklyProgress}
                    onChange={(e) => updatePreference('weeklyProgress', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* Social Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Social Updates</div>
                    <div className="text-xs text-gray-500">Friends' activities and achievements</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.socialUpdates}
                    onChange={(e) => updatePreference('socialUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">System Updates</div>
                    <div className="text-xs text-gray-500">Important app updates and maintenance</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.systemUpdates}
                    onChange={(e) => updatePreference('systemUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Delivery Methods & Settings */}
          <div className="space-y-6">
            {/* Delivery Methods */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Methods</h3>

              <div className="space-y-4">
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-coral-500 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                      <div className="text-xs text-gray-500">
                        {hasWebPushSupport 
                          ? `Browser notifications (${webPushPermission})`
                          : 'Not supported in this browser'
                        }
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications && hasWebPushSupport}
                      onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                      disabled={!hasWebPushSupport}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500 disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-coral-500" />
                Quiet Hours
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Enable Quiet Hours</div>
                    <div className="text-xs text-gray-500">Suppress notifications during specified hours</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.quietHours.enabled}
                      onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                {preferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) => updateQuietHours('start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) => updateQuietHours('end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={sendTestNotification}
          disabled={loadingTest || !preferences.notificationsEnabled}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <BellIcon className="h-4 w-4 mr-2" />
          {loadingTest ? 'Sending...' : 'Send Test Notification'}
        </button>

        <div className="flex space-x-3">
          <button
            onClick={loadPreferences}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset
          </button>
          <button
            onClick={updatePreferences}
            disabled={loading}
            className="px-6 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotificationPreferences;