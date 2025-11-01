import React, { useState } from 'react';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import { withAuth, useAuth } from '../contexts/AuthContext';
import ProgressVisualization from '../components/analytics/ProgressVisualization';
import DataExport from '../components/analytics/DataExport';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

function Analytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'export' | 'settings'>('overview');

  const tabs = [
    {
      id: 'overview' as const,
      name: 'Analytics Overview',
      icon: ChartBarIcon,
      description: 'View your progress trends and performance analytics'
    },
    {
      id: 'export' as const,
      name: 'Data Export',
      icon: DocumentArrowDownIcon,
      description: 'Export your workout data and analytics reports'
    },
    {
      id: 'settings' as const,
      name: 'Settings',
      icon: Cog6ToothIcon,
      description: 'Configure your analytics preferences'
    }
  ];

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
            <p className="text-gray-400">
              Track your progress, analyze performance trends, and export your data
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && user && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Progress Analytics</h2>
                  <p className="text-gray-400">
                    Analyze your workout trends, goal progress, and performance metrics over time
                  </p>
                </div>
                <ProgressVisualization
                  userId={user.id}
                  period="3months"
                  showGoals={true}
                  showTrends={true}
                  showComparison={false}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Export Your Data</h2>
                  <p className="text-gray-400">
                    Download your workout data, analytics reports, and goal progress in various formats
                  </p>
                </div>
                <DataExport />
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Analytics Settings</h2>
                  <p className="text-gray-400">
                    Configure your analytics preferences and data visibility
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Data Visibility</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500" />
                          <span className="ml-3 text-sm text-gray-300">Show GPS tracking data in exports</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500" />
                          <span className="ml-3 text-sm text-gray-300">Include heart rate data in analytics</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500" />
                          <span className="ml-3 text-sm text-gray-300">Show detailed pace analysis</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Default Export Format</h3>
                      <select className="w-full max-w-xs bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="csv">CSV (Spreadsheet)</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                        <option value="json">JSON (Raw Data)</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Analytics Period</h3>
                      <select className="w-full max-w-xs bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="1month">Last Month</option>
                        <option value="3months" selected>Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last Year</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

export default withAuth(Analytics);