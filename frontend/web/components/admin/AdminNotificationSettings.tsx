// Admin Notification Settings Component
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger';
import { 
  BellIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface AdminNotificationPreferences {
  receiveUserSignups: boolean;
  receiveErrorAlerts: boolean;
  receiveSystemUpdates: boolean;
  receiveWeeklyReports: boolean;
  receiveSecurityAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const AdminNotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<AdminNotificationPreferences>({
    receiveUserSignups: true,
    receiveErrorAlerts: true,
    receiveSystemUpdates: true,
    receiveWeeklyReports: true,
    receiveSecurityAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/admin-notifications/admin-preferences', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setPreferences(result.data.preferences);
        setAdminEmail(result.data.adminEmail);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load admin preferences:', { error: error });
      toast.error('Failed to load preferences');
    }
  };

  const updatePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-notifications/admin-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          preferences
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Admin notification preferences updated');
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

  const sendTestAlert = async () => {
    setLoadingTest(true);
    try {
      const response = await fetch('/api/admin-notifications/admin-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title: 'Test Admin Alert',
          body: 'This is a test admin notification to verify your settings are working correctly.',
          type: 'test',
          priority: 'normal'
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test alert sent to all admins');
      } else {
        toast.error(result.message || 'Failed to send test alert');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to send test alert:', { error: error });
      toast.error('Failed to send test alert');
    } finally {
      setLoadingTest(false);
    }
  };

  const updatePreference = (key: keyof AdminNotificationPreferences, value: any) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <CogIcon className="h-6 w-6 mr-2 text-coral-500" />
          Admin Notification Settings
        </h2>
        <p className="text-gray-600 mt-1">
          Configure how you receive notifications as an administrator
        </p>
        {adminEmail && (
          <p className="text-sm text-muted mt-2">
            Notifications will be sent to: <span className="font-medium">{adminEmail}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-coral-500" />
            Notification Types
          </h3>

          <div className="space-y-4">
            {/* User Signups */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">User Signups</div>
                  <div className="text-xs text-muted">Get notified when new users register</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.receiveUserSignups}
                  onChange={(e) => updatePreference('receiveUserSignups', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
              </label>
            </div>

            {/* Error Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Error Alerts</div>
                  <div className="text-xs text-muted">Critical system errors and failures</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.receiveErrorAlerts}
                  onChange={(e) => updatePreference('receiveErrorAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
              </label>
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CogIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">System Updates</div>
                  <div className="text-xs text-muted">Maintenance, deployments, and updates</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.receiveSystemUpdates}
                  onChange={(e) => updatePreference('receiveSystemUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
              </label>
            </div>

            {/* Weekly Reports */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BellIcon className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Weekly Reports</div>
                  <div className="text-xs text-muted">Platform usage and performance summaries</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.receiveWeeklyReports}
                  onChange={(e) => updatePreference('receiveWeeklyReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
              </label>
            </div>

            {/* Security Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Security Alerts</div>
                  <div className="text-xs text-muted">Login anomalies and security threats</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.receiveSecurityAlerts}
                  onChange={(e) => updatePreference('receiveSecurityAlerts', e.target.checked)}
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
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                    <div className="text-xs text-muted">Receive notifications via email</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-coral-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                    <div className="text-xs text-muted">Receive browser/mobile push notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
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
                  <div className="text-xs text-muted">Suppress non-critical notifications during specified hours</div>
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={sendTestAlert}
          disabled={loadingTest}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <BellIcon className="h-4 w-4 mr-2" />
          {loadingTest ? 'Sending...' : 'Send Test Alert'}
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
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;