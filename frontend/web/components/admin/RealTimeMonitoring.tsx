import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../lib/api'
import { logger } from '../../lib/productionLogger'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  cpu: number
  memory: number
  disk: number
  responseTime: number
  activeConnections: number
  errorRate: number
  uptime: number
}

interface ActiveUsers {
  total: number
  authenticated: number
  anonymous: number
  locations: Array<{ country: string; count: number }>
}

interface SystemMetrics {
  timestamp: string
  requests: number
  errors: number
  responseTime: number
  activeUsers: number
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  acknowledged: boolean
  details?: string
}

export default function RealTimeMonitoring() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUsers | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    loadInitialData()
    
    if (autoRefresh) {
      startRealTimeUpdates()
    }

    return () => {
      stopRealTimeUpdates()
    }
  }, [autoRefresh])

  const loadInitialData = async () => {
    try {
      const [healthResponse, usersResponse, metricsResponse, alertsResponse] = await Promise.all([
        apiService.get('/api/admin/monitoring/health') as Promise<{ data: SystemHealth }>,
        apiService.get('/api/admin/monitoring/active-users') as Promise<{ data: ActiveUsers }>,
        apiService.get('/api/admin/monitoring/metrics?timeRange=1h') as Promise<{ data: SystemMetrics[] }>,
        apiService.get('/api/admin/monitoring/alerts?status=active') as Promise<{ data: Alert[] }>
      ])

      setSystemHealth(healthResponse.data)
      setActiveUsers(usersResponse.data)
      setMetrics(metricsResponse.data)
      setAlerts(alertsResponse.data)
    } catch (error) {
      logger.error('ERROR', 'Error loading monitoring data:', { error: error })
    }
  }

  const startRealTimeUpdates = () => {
    // Use WebSocket for real-time updates (if available) or polling
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/admin/monitoring/ws`

    try {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        logger.info('COMPONENT', 'Real-time monitoring connected')
      }

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleRealTimeUpdate(data)
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        // Fallback to polling if WebSocket fails
        startPolling()
      }

      wsRef.current.onerror = () => {
        setIsConnected(false)
        // Fallback to polling
        startPolling()
      }
    } catch (error) {
      // Fallback to polling if WebSocket is not available
      startPolling()
    }
  }

  const startPolling = () => {
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadInitialData()
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }

  const stopRealTimeUpdates = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const handleRealTimeUpdate = (data: any) => {
    switch (data.type) {
      case 'system_health':
        setSystemHealth(data.payload)
        break
      case 'active_users':
        setActiveUsers(data.payload)
        break
      case 'metrics':
        setMetrics(prev => [...prev.slice(-59), data.payload]) // Keep last 60 points
        break
      case 'alert':
        setAlerts(prev => [data.payload, ...prev])
        break
      case 'alert_acknowledged':
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === data.payload.id 
              ? { ...alert, acknowledged: true } 
              : alert
          )
        )
        break
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiService.post(`/api/admin/monitoring/alerts/${alertId}/acknowledge`)
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      )
    } catch (error) {
      logger.error('ERROR', 'Error acknowledging alert:', { error: error })
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-adaptive-light'
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'critical': return '🔴'
      default: return '❓'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
    }
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }
    return (bytes / 1024).toFixed(1) + ' KB'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-adaptive-white">Real-time monitorings</h2>
          <p className="text-adaptive-light">Sistēmas stāvokļa uzraudzība reāllaikā</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            {isConnected ? 'Savienots' : 'Nav savienojuma'}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-ghost ${autoRefresh ? 'text-coral' : 'text-adaptive-light'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {autoRefresh ? 'Atspējot auto-refresh' : 'Iespējot auto-refresh'}
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-adaptive-light text-sm">Sistēmas stāvoklis</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{getHealthStatusIcon(systemHealth.status)}</span>
                  <span className={`font-bold ${getHealthStatusColor(systemHealth.status)}`}>
                    {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-adaptive-light">
                Uptime: {formatUptime(systemHealth.uptime)}
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">CPU izmantošana</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        systemHealth.cpu > 80 ? 'bg-red-500' : 
                        systemHealth.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${systemHealth.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-adaptive-white font-bold">{systemHealth.cpu.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Atmiņas izmantošana</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        systemHealth.memory > 80 ? 'bg-red-500' : 
                        systemHealth.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${systemHealth.memory}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-adaptive-white font-bold">{systemHealth.memory.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Atbildes laiks</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-adaptive-white">
                  {systemHealth.responseTime}ms
                </span>
                <div className="text-right text-xs text-adaptive-light">
                  <div>Kļūdu: {systemHealth.errorRate.toFixed(2)}%</div>
                  <div>Savienojumi: {systemHealth.activeConnections}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Users and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users */}
        {activeUsers && (
          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Aktīvi lietotāji</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral">{activeUsers.total}</div>
                  <div className="text-sm text-adaptive-light">Kopā</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{activeUsers.authenticated}</div>
                  <div className="text-sm text-adaptive-light">Autentificēti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-adaptive-light">{activeUsers.anonymous}</div>
                  <div className="text-sm text-adaptive-light">Anonīmi</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-adaptive-light mb-2">Pēc valstīm</h4>
                <div className="space-y-2">
                  {activeUsers.locations.slice(0, 5).map((location) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <span className="text-adaptive-light">{location.country}</span>
                      <span className="text-adaptive-white font-medium">{location.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Metrics Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-adaptive-white mb-4">Reāllaika metrikas</h3>
          <div className="h-48">
            {metrics.length > 0 && (
              <div className="h-full flex items-end gap-1">
                {metrics.slice(-20).map((metric, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-coral rounded-t transition-all duration-300"
                      style={{
                        height: `${Math.max(5, (metric.requests / Math.max(...metrics.map(m => m.requests))) * 100)}%`
                      }}
                      title={`${metric.requests} pieprasījumi, ${metric.errors} errors`}
                    ></div>
                    {index % 5 === 0 && (
                      <span className="text-xs text-adaptive-light mt-1">
                        {new Date(metric.timestamp).toLocaleTimeString('lv', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-adaptive-white">Brīdinājumi un errors</h3>
          <div className="text-sm text-adaptive-light">
            {alerts.filter(a => !a.acknowledged).length} neapliecināti
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-adaptive-light">
            Nav aktīvu brīdinājumu
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.acknowledged
                    ? 'bg-gray-800/30 border-gray-700'
                    : alert.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.type === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {alert.type === 'error' ? '🔴' : 
                         alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className={`font-medium ${
                        alert.acknowledged ? 'text-adaptive-light' : 'text-adaptive-white'
                      }`}>
                        {alert.message}
                      </span>
                    </div>
                    <div className="text-sm text-adaptive-light mt-1">
                      {new Date(alert.timestamp).toLocaleString('lv')}
                    </div>
                    {alert.details && (
                      <div className="text-sm text-adaptive-light mt-2">
                        {alert.details}
                      </div>
                    )}
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-3 px-3 py-1 bg-gray-700 text-adaptive-light text-sm rounded hover:bg-gray-600 transition-colors"
                    >
                      Apliecināt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}