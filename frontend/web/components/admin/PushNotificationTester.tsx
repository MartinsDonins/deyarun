// Admin Push Notification Testing Component
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger';
import { 
  BellIcon, 
  UserIcon, 
  UsersIcon, 
  CogIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  email: string;
  name: string;
  deviceTokens?: number;
  notificationsEnabled?: boolean;
}

interface NotificationTemplate {
  title: string;
  body: string;
  type: string;
  data: any;
}

interface PlatformStats {
  overview: {
    totalUsers: number;
    enabledUsers: number;
    disabledUsers: number;
    totalTokens: number;
    activeTokens: number;
    inactiveTokens: number;
  };
  platforms: {
    ios: number;
    android: number;
    web: number;
    unknown: number;
  };
  percentages: {
    usersWithNotifications: number;
    activeTokensPercentage: number;
  };
}

const PushNotificationTester: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Record<string, NotificationTemplate>>({});
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('test');
  const [platform, setPlatform] = useState('all');
  const [priority, setPriority] = useState('normal');
  const [customData, setCustomData] = useState('{}');
  const [scheduledFor, setScheduledFor] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('single');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadUsers();
    loadTemplates();
    loadPlatformStats();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users || []);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load users:', { error: error });
      toast.error('Failed to load users');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin-notifications/templates', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load templates:', { error: error });
    }
  };

  const loadPlatformStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/admin-notifications/platform-stats', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPlatformStats(result.data);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load platform stats:', { error: error });
    } finally {
      setLoadingStats(false);
    }
  };

  const sendTestNotification = async () => {
    if (!title || !body) {
      toast.error('Title and body are required');
      return;
    }

    if (activeTab === 'single' && selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      let customDataObj = {};
      try {
        customDataObj = JSON.parse(customData);
      } catch (e) {
        logger.warn('WARNING', 'Invalid JSON in custom data, using empty object');
      }

      const payload = {
        title,
        body,
        type,
        platform: platform === 'all' ? undefined : platform,
        priority,
        data: customDataObj
      };

      let response;
      if (activeTab === 'single') {
        // Send to specific users
        if (selectedUsers.length === 1) {
          response = await fetch('/api/admin-notifications/test-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              ...payload,
              userId: selectedUsers[0]
            })
          });
        } else {
          response = await fetch('/api/admin-notifications/send-bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              ...payload,
              userIds: selectedUsers
            })
          });
        }
      } else {
        // Send to all users with criteria
        response = await fetch('/api/admin-notifications/send-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            ...payload,
            criteria: {
              hasDeviceTokens: true,
              subscriptionType: type === 'premium' ? 'premium' : undefined
            }
          })
        });
      }

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        
        // Reset form
        setTitle('');
        setBody('');
        setCustomData('{}');
        setSelectedUsers([]);
      } else {
        toast.error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      logger.error('ERROR', 'Send notification error:', { error: error });
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async () => {
    if (!title || !body || !scheduledFor) {
      toast.error('Title, body, and scheduled time are required');
      return;
    }

    setLoading(true);
    try {
      let customDataObj = {};
      try {
        customDataObj = JSON.parse(customData);
      } catch (e) {
        logger.warn('WARNING', 'Invalid JSON in custom data, using empty object');
      }

      const response = await fetch('/api/admin-notifications/schedule-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title,
          body,
          type,
          data: customDataObj,
          scheduledFor: new Date(scheduledFor).toISOString(),
          userIds: activeTab === 'single' ? selectedUsers : undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Notification scheduled successfully');
        setScheduledFor('');
      } else {
        toast.error(result.message || 'Failed to schedule notification');
      }
    } catch (error) {
      logger.error('ERROR', 'Schedule notification error:', { error: error });
      toast.error('Failed to schedule notification');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      setTitle(template.title);
      setBody(template.body);
      setType(template.type);
      if (template.data) {
        setCustomData(JSON.stringify(template.data, null, 2));
      }
    }
  };

  const cleanupTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-notifications/cleanup-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Cleanup completed: ${result.data.removedTokens} invalid tokens removed`);
        loadPlatformStats(); // Refresh stats
      } else {
        toast.error(result.message || 'Cleanup failed');
      }
    } catch (error) {
      logger.error('ERROR', 'Token cleanup error:', { error: error });
      toast.error('Token cleanup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BellIcon className="h-6 w-6 mr-2 text-coral-500" />
          Push Notification Testing
        </h2>
        <p className="text-gray-600 mt-1">Test and manage push notifications across all platforms</p>
      </div>

      {/* Platform Statistics */}
      {!loadingStats && platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{platformStats.overview.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Notifications Enabled</p>
                <p className="text-2xl font-semibold text-gray-900">{platformStats.overview.enabledUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-coral-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Tokens</p>
                <p className="text-2xl font-semibold text-gray-900">{platformStats.overview.activeTokens}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Platforms</p>
                <div className="text-xs text-gray-600 mt-1">
                  iOS: {platformStats.platforms.ios} | Android: {platformStats.platforms.android} | Web: {platformStats.platforms.web}
                </div>
              </div>
              <button
                onClick={cleanupTokens}
                disabled={loading}
                className="px-3 py-1 text-xs bg-coral-500 text-white rounded hover:bg-coral-600 disabled:opacity-50"
              >
                Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interface */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('single')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'single'
                    ? 'border-coral-500 text-coral-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="h-4 w-4 inline mr-1" />
                Single/Multiple Users
              </button>
              <button
                onClick={() => setActiveTab('broadcast')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'broadcast'
                    ? 'border-coral-500 text-coral-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UsersIcon className="h-4 w-4 inline mr-1" />
                Broadcast to All
              </button>
            </nav>
          </div>

          {/* User Selection (for single/multiple tab) */}
          {activeTab === 'single' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {users.map((user) => (
                  <label key={user._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                      className="h-4 w-4 text-coral-600 focus:ring-coral-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                      <div className="text-xs text-gray-500">
                        {user.email} | Tokens: {user.deviceTokens || 0} | 
                        {user.notificationsEnabled ? ' ✅ Enabled' : ' ❌ Disabled'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Selected: {selectedUsers.length} users
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(key)}
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 text-left"
                >
                  <div className="font-medium">{template.title}</div>
                  <div className="text-gray-500 truncate">{template.body}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
              >
                <option value="test">Test</option>
                <option value="workout_reminder">Workout Reminder</option>
                <option value="achievement">Achievement</option>
                <option value="course_update">Course Update</option>
                <option value="weekly_progress">Weekly Progress</option>
                <option value="social_update">Social Update</option>
                <option value="system_update">System Update</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Body *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
              placeholder="Notification message body"
            />
          </div>

          {/* Advanced Settings */}
          <div className="mt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-coral-600 hover:text-coral-700"
            >
              <CogIcon className="h-4 w-4 mr-1" />
              Advanced Settings {showAdvanced ? '▼' : '▶'}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                    >
                      <option value="all">All Platforms</option>
                      <option value="ios">iOS Only</option>
                      <option value="android">Android Only</option>
                      <option value="web">Web Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Data (JSON)
                  </label>
                  <textarea
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500 font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule For Later
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-coral-500 focus:border-coral-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={sendTestNotification}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-coral-500 text-white rounded-md hover:bg-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Now'}
            </button>

            {scheduledFor && (
              <button
                onClick={scheduleNotification}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Schedule
              </button>
            )}

            <button
              onClick={() => {
                setTitle('');
                setBody('');
                setCustomData('{}');
                setSelectedUsers([]);
                setScheduledFor('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationTester;