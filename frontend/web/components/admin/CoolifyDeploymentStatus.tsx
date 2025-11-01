import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAuthToken } from '../../lib/auth'
import { logger } from '../../lib/productionLogger'

interface CoolifyDeploymentData {
  platform: string
  timestamp: string
  available: boolean
  error?: string
  services: {
    backend: {
      status: string
      health: string
      uptime?: string | null
      lastDeployment?: string | null
      url?: string | null
      name?: string
      error?: string | null
    }
    frontend: {
      status: string
      health: string
      uptime?: string | null
      lastDeployment?: string | null
      url?: string | null
      name?: string
      error?: string | null
    }
  }
  server?: {
    status: string
    uptime?: string | null
  }
}

interface CoolifyDeploymentProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function CoolifyDeploymentStatus({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 30000 
}: CoolifyDeploymentProps) {
  const { isAdmin } = useAuth()
  const [status, setStatus] = useState<CoolifyDeploymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchDeploymentStatus = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)
      
      const token = getAuthToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${apiUrl}/api/deployment/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch deployment status')
      }

      setStatus(data.data)
      setLastRefresh(new Date())
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logger.error('ERROR', 'Failed to fetch Coolify deployment status:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return

    fetchDeploymentStatus()

    if (autoRefresh) {
      const interval = setInterval(fetchDeploymentStatus, refreshInterval)
      return () => clearInterval(interval)
    }
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
      case 'stopped':
      case 'warning':
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20'
      case 'error':
      case 'failed':
      case 'crashed':
        return 'text-red-400 bg-red-900/20'
      case 'building':
      case 'deploying':
        return 'text-blue-400 bg-blue-900/20'
      case 'not_configured':
        return 'text-adaptive-light bg-gray-900/20'
      default:
        return 'text-adaptive-light bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'healthy':
      case 'ok':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'building':
      case 'deploying':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'stopped':
      case 'warning':
      case 'degraded':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'error':
      case 'failed':
      case 'crashed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatLastDeployment = (dateString?: string | null) => {
    if (!dateString) return 'Nav datu'
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'dienu' : 'dienas'} atpakaļ`
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'stundu' : 'stundas'} atpakaļ`
      } else {
        return 'Tikko'
      }
    } catch {
      return dateString
    }
  }

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-adaptive-white">Coolify Deployment</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-xs text-purple-300">Coolify</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm bg-gray-700 text-adaptive-light rounded hover:bg-gray-600 transition-colors"
            >
              {isExpanded ? 'Sakļaut' : 'Izvērst'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDeploymentStatus}
              disabled={loading}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Refresh'}
            </button>
            <span className="text-xs text-adaptive-light">
              Last check: {formatDate(lastRefresh)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Status Overview */}
      <div className="p-4">
        {loading && !status ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : status ? (
          <div className="space-y-4">
            {/* Availability Status */}
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-adaptive-light">Coolify API:</span>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                status.available ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
              }`}>
                {status.available ? getStatusIcon('healthy') : getStatusIcon('error')}
                <span>{status.available ? 'Available' : 'Not available'}</span>
              </div>
            </div>

            {status.available && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Backend Status */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-adaptive-white">Backend</h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${getStatusColor(status.services.backend.status)}`}>
                      {getStatusIcon(status.services.backend.status)}
                      <span>{capitalizeStatus(status.services.backend.status)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-adaptive-light">Veselība:</span>
                      <span className="text-adaptive-light">{capitalizeStatus(status.services.backend.health)}</span>
                    </div>
                    {status.services.backend.name && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">Nosaukums:</span>
                        <span className="text-adaptive-light truncate max-w-32">{status.services.backend.name}</span>
                      </div>
                    )}
                    {status.services.backend.lastDeployment && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">Pēdējais deployment:</span>
                        <span className="text-adaptive-light">{formatLastDeployment(status.services.backend.lastDeployment)}</span>
                      </div>
                    )}
                    {status.services.backend.url && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">URL:</span>
                        <a 
                          href={status.services.backend.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 truncate max-w-32 text-xs"
                        >
                          {status.services.backend.url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {status.services.backend.error && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
                        {status.services.backend.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Frontend Status */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-adaptive-white">Frontend</h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${getStatusColor(status.services.frontend.status)}`}>
                      {getStatusIcon(status.services.frontend.status)}
                      <span>{capitalizeStatus(status.services.frontend.status)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-adaptive-light">Veselība:</span>
                      <span className="text-adaptive-light">{capitalizeStatus(status.services.frontend.health)}</span>
                    </div>
                    {status.services.frontend.name && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">Nosaukums:</span>
                        <span className="text-adaptive-light truncate max-w-32">{status.services.frontend.name}</span>
                      </div>
                    )}
                    {status.services.frontend.lastDeployment && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">Pēdējais deployment:</span>
                        <span className="text-adaptive-light">{formatLastDeployment(status.services.frontend.lastDeployment)}</span>
                      </div>
                    )}
                    {status.services.frontend.url && (
                      <div className="flex justify-between">
                        <span className="text-adaptive-light">URL:</span>
                        <a 
                          href={status.services.frontend.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 truncate max-w-32 text-xs"
                        >
                          {status.services.frontend.url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {status.services.frontend.error && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
                        {status.services.frontend.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Server Status */}
            {status.server && isExpanded && (
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-medium text-adaptive-white mb-3">Server Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-adaptive-light">Status:</span>
                    <span className="text-adaptive-light">{capitalizeStatus(status.server.status)}</span>
                  </div>
                  {status.server.uptime && (
                    <div className="flex justify-between">
                      <span className="text-adaptive-light">Uptime:</span>
                      <span className="text-adaptive-light">{status.server.uptime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error State */}
            {status.error && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <h4 className="font-medium text-red-400 mb-2">Integration error</h4>
                <p className="text-red-300 text-sm">{status.error}</p>
                <p className="text-red-400 text-xs mt-2">
                  Pārbaudiet Coolify API konfigurāciju un piekļuves tiesības.
                </p>
              </div>
            )}

            {/* Configuration Warning */}
            {!status.available && !status.error && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <h4 className="font-medium text-yellow-400 mb-2">Nav konfigurēts</h4>
                <p className="text-yellow-300 text-sm">
                  Coolify integrācija nav konfigurēta. Iestatiet COOLIFY_API_URL un COOLIFY_API_TOKEN vides mainīgos.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-adaptive-light py-8">
            Nav pieejami deployment dati
          </div>
        )}
      </div>
    </div>
  )
}