import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAuthToken } from '../lib/auth'
import { logger } from '../lib/productionLogger'

export interface CoolifyService {
  status: string
  health: string
  uptime?: string | null
  lastDeployment?: string | null
  url?: string | null
  name?: string
  error?: string | null
}

export interface CoolifyDeploymentStatus {
  platform: string
  timestamp: string
  available: boolean
  error?: string
  services: {
    backend: CoolifyService
    frontend: CoolifyService
  }
  server?: {
    status: string
    uptime?: string | null
  }
}

export interface CoolifyDeployment {
  service: 'backend' | 'frontend'
  id: string
  status: string
  created_at: string
  finished_at?: string
  commit?: string
}

interface UseCoolifyDeploymentOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseCoolifyDeploymentReturn {
  status: CoolifyDeploymentStatus | null
  deployments: CoolifyDeployment[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshStatus: () => Promise<void>
  refreshDeployments: () => Promise<void>
  isConfigured: boolean
  connectionHealthy: boolean
}

export function useCoolifyDeployment(options: UseCoolifyDeploymentOptions = {}): UseCoolifyDeploymentReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options
  const { isAdmin } = useAuth()
  
  const [status, setStatus] = useState<CoolifyDeploymentStatus | null>(null)
  const [deployments, setDeployments] = useState<CoolifyDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [connectionHealthy, setConnectionHealthy] = useState(false)

  const makeApiRequest = async (endpoint: string) => {
    if (!isAdmin) {
      throw new Error('Admin access required')
    }

    const token = getAuthToken()
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    
    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(`${apiUrl}/api/deployment${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle 403 silently - user doesn't have admin access
        if (response.status === 403) {
          throw new Error('Insufficient permissions')
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed')
      }

      return data.data
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout after 10 seconds')
      }
      throw err
    }
  }

  const refreshStatus = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)
      
      const statusData = await makeApiRequest('/status')
      setStatus(statusData)
      setLastUpdated(new Date())
      
      // Update configuration status
      setIsConfigured(statusData.available)
      setConnectionHealthy(statusData.available && !statusData.error)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Don't log permission errors to console
      if (errorMessage !== 'Insufficient permissions') {
        logger.error('ERROR', 'Failed to fetch Coolify status:', { error: err })
      }
      
      setError(errorMessage)
      
      // Reset status on error
      setStatus(null)
      setIsConfigured(false)
      setConnectionHealthy(false)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  const refreshDeployments = useCallback(async () => {
    if (!isAdmin) return

    try {
      const deploymentsData = await makeApiRequest('/deployments')
      setDeployments(deploymentsData || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Don't log permission errors to console
      if (errorMessage !== 'Insufficient permissions') {
        logger.error('ERROR', 'Failed to fetch Coolify deployments:', { error: err })
      }
      
      setDeployments([])
    }
  }, [isAdmin])

  // Check health of Coolify integration
  const checkHealth = useCallback(async () => {
    if (!isAdmin) return

    try {
      const healthData = await makeApiRequest('/health')
      setIsConfigured(healthData.configured)
      setConnectionHealthy(healthData.connected)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Don't log permission errors to console
      if (errorMessage !== 'Insufficient permissions') {
        logger.error('ERROR', 'Failed to check Coolify health:', { error: err })
      }
      
      setIsConfigured(false)
      setConnectionHealthy(false)
    }
  }, [isAdmin])

  // Initial load
  useEffect(() => {
    if (!isAdmin) return

    const loadData = async () => {
      await Promise.all([
        refreshStatus(),
        refreshDeployments(),
        checkHealth()
      ])
    }

    loadData()
  }, [isAdmin, refreshStatus, refreshDeployments, checkHealth])

  // Auto-refresh
  useEffect(() => {
    if (!isAdmin || !autoRefresh) return

    const interval = setInterval(async () => {
      await Promise.all([
        refreshStatus(),
        refreshDeployments()
      ])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isAdmin, autoRefresh, refreshInterval, refreshStatus, refreshDeployments])

  return {
    status,
    deployments,
    loading,
    error,
    lastUpdated,
    refreshStatus,
    refreshDeployments,
    isConfigured,
    connectionHealthy
  }
}

// Helper functions for status parsing
export function getServiceStatusColor(status: string): string {
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
      return 'text-gray-400 bg-gray-900/20'
    default:
      return 'text-gray-400 bg-gray-900/20'
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'Nav datu'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'dienu' : 'dienas'} atpakaļ`
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'stundu' : 'stundas'} atpakaļ`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minūti' : 'minūtes'} atpakaļ`
    } else {
      return 'Tikko'
    }
  } catch {
    return dateString
  }
}

export function isServiceHealthy(service: CoolifyService): boolean {
  const healthyStatuses = ['running', 'healthy', 'ok']
  return healthyStatuses.includes(service.status.toLowerCase()) && 
         healthyStatuses.includes(service.health.toLowerCase())
}

export function getOverallHealthStatus(status: CoolifyDeploymentStatus | null): 'healthy' | 'degraded' | 'error' | 'unknown' {
  if (!status || !status.available) {
    return 'unknown'
  }

  const backendHealthy = isServiceHealthy(status.services.backend)
  const frontendHealthy = isServiceHealthy(status.services.frontend)

  if (backendHealthy && frontendHealthy) {
    return 'healthy'
  } else if (backendHealthy || frontendHealthy) {
    return 'degraded'
  } else {
    return 'error'
  }
}