import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { withAdminAuth } from '../../contexts/AuthContext'
import AdvancedAnalyticsDashboard from '../../components/admin/AdvancedAnalyticsDashboard'
import ExportManager from '../../components/admin/ExportManager'

function EnhancedAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'analytics' | 'exports'>('analytics')

  return (
    <AdminLayout title="Uzlabota analītika">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Uzlabota analītika</h1>
          <p className="text-gray-400">
            Detalizēta analītika ar eksporta funkcionalitāti un real-time datiem
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-coral text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Detalizēta analītika
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'exports'
                ? 'bg-coral text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Datu eksporti
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <AdvancedAnalyticsDashboard 
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        )}

        {activeTab === 'exports' && (
          <ExportManager />
        )}
      </div>
    </AdminLayout>
  )
}

export default withAdminAuth(EnhancedAnalytics)