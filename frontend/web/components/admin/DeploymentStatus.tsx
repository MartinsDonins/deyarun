import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminLogger } from '../../lib/logger'
import { useCoolifyDeployment } from '../../hooks/useCoolifyDeployment'
import ServerInfoCard from './ServerInfoCard'
import { getAuthToken } from '../../utils/auth'

interface DeploymentStatusProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface VersionInfo {
  backend: string
  frontend: string  
  mobile: string
  timestamp: string
}

export default function DeploymentStatus({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 30000 
}: DeploymentStatusProps) {
  const { isAdmin } = useAuth()
  const [versions, setVersions] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Use Coolify deployment hook
  const {
    status: coolifyStatus,
    loading: coolifyLoading,
    error: coolifyError,
    isConfigured: coolifyConfigured,
    connectionHealthy,
    refreshStatus: refreshCoolifyStatus
  } = useCoolifyDeployment({ autoRefresh, refreshInterval })

  const fetchVersions = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)
      adminLogger.info('VERSION_FETCH', 'Fetching version information')
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/versions`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setVersions(data.data)
        setLastRefresh(new Date())
        adminLogger.info('VERSION_FETCH', 'Successfully fetched versions', data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch versions')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      adminLogger.logError('version_fetch', err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchVersions()
  }, [isAdmin])

  // Auto-refresh versions
  useEffect(() => {
    if (!isAdmin || !autoRefresh) return

    const interval = setInterval(() => {
      fetchVersions()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isAdmin, autoRefresh, refreshInterval])

  if (!isAdmin) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'healthy':
      case 'ok':
        return 'text-green-400 bg-green-900/20'
      case 'degraded':
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20'
      case 'error':
      case 'failed':
        return 'text-red-400 bg-red-900/20'
      case 'building':
      case 'deploying':
        return 'text-blue-400 bg-blue-900/20'
      default:
        return 'text-adaptive-light bg-gray-900/20'
    }
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-adaptive-white">Deployment & Versions</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchVersions()
                refreshCoolifyStatus()
              }}
              disabled={loading || coolifyLoading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-adaptive-white rounded text-sm transition-colors"
            >
              {loading || coolifyLoading ? '⟳' : '🔄'} Refresh
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-adaptive-white rounded text-sm transition-colors"
            >
              {isExpanded ? '▲' : '▼'} {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Version Information */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-adaptive-white mb-3">📦 Component Versions</h4>
          {loading ? (
            <div className="text-adaptive-light">Loading versions...</div>
          ) : error ? (
            <div className="text-red-400">Error: {error}</div>
          ) : versions ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-adaptive-light">Backend API</div>
                <div className="text-lg font-mono text-green-400">{versions.backend}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-adaptive-light">Frontend Web</div>
                <div className="text-lg font-mono text-blue-400">{versions.frontend}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-adaptive-light">Mobile App</div>
                <div className="text-lg font-mono text-purple-400">{versions.mobile}</div>
              </div>
            </div>
          ) : (
            <div className="text-adaptive-light">No version data available</div>
          )}
        </div>

        {/* Server IP Information */}
        <div className="mb-6">
          <ServerInfoCard />
        </div>

        {/* Coolify Status */}
        <div className="mb-4">
          <h4 className="text-lg font-medium text-adaptive-white mb-3">🚀 Coolify Deployment Status</h4>
          {coolifyLoading ? (
            <div className="text-adaptive-light">Loading deployment status...</div>
          ) : coolifyError ? (
            <div className="text-yellow-400">
              ⚠️ {coolifyConfigured ? 'Connection error' : 'Not configured'}: {coolifyError}
            </div>
          ) : coolifyConfigured && coolifyStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Platform:</span>
                <span className="text-blue-400">{coolifyStatus.platform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Status:</span>
                <span className={`px-2 py-1 rounded text-xs ${coolifyStatus.available ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                  {coolifyStatus.available ? '✅ Available' : '❌ Unavailable'}
                </span>
              </div>
              {coolifyStatus.services && (
                <div className="space-y-2">
                  <div className="text-sm text-adaptive-light">Services:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700 p-2 rounded">
                      <div className="text-xs text-adaptive-light">Backend</div>
                      <div className={`text-sm ${getStatusColor(coolifyStatus.services.backend?.status || 'unknown')}`}>
                        {coolifyStatus.services.backend?.status || 'Unknown'}
                      </div>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <div className="text-xs text-adaptive-light">Frontend</div>
                      <div className={`text-sm ${getStatusColor(coolifyStatus.services.frontend?.status || 'unknown')}`}>
                        {coolifyStatus.services.frontend?.status || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-adaptive-light">
              ℹ️ Coolify monitoring is not configured or temporarily disabled
              <div className="text-sm text-muted mt-1">
                Configure COOLIFY_API_KEY with proper permissions to enable monitoring
              </div>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-adaptive-light space-y-2">
              <div>Last updated: {lastRefresh.toLocaleTimeString()}</div>
              {versions && (
                <div>Version timestamp: {new Date(versions.timestamp).toLocaleString()}</div>
              )}
              <div>Connection healthy: {connectionHealthy ? '✅ Yes' : '❌ No'}</div>
              <div>Auto-refresh: {autoRefresh ? `✅ Every ${refreshInterval/1000}s` : '❌ Disabled'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}