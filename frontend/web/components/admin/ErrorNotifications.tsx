import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminLogger } from '../../lib/logger'
import { logger } from '../../lib/productionLogger'

interface ErrorNotification {
  id: string
  title: string
  message: string
  level: 'error' | 'warning' | 'info'
  source: 'vercel' | 'coolify' | 'api' | 'frontend' | 'system'
  timestamp: Date
  acknowledged: boolean
  details?: any
}

interface ErrorNotificationsProps {
  className?: string
  maxNotifications?: number
}

export default function ErrorNotifications({ 
  className = '',
  maxNotifications = 10 
}: ErrorNotificationsProps) {
  const { isAdmin } = useAuth()
  const [notifications, setNotifications] = useState<ErrorNotification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all')

  // Simulate error monitoring - in production, this would connect to actual monitoring services
  const checkForErrors = async () => {
    if (!isAdmin) return

    try {
      const errors: ErrorNotification[] = []

      // Check API health
      try {
        const response = await fetch('https://api.deyarun.com/health')
        if (!response.ok) {
          errors.push({
            id: `api-health-${Date.now()}`,
            title: 'API Health Check Failed',
            message: `Backend API responded with status ${response.status}`,
            level: 'error',
            source: 'api',
            timestamp: new Date(),
            acknowledged: false,
            details: { status: response.status, url: response.url }
          })
        }
      } catch (error) {
        errors.push({
          id: `api-connection-${Date.now()}`,
          title: 'API Connection Error',
          message: 'Unable to connect to backend API',
          level: 'error',
          source: 'api',
          timestamp: new Date(),
          acknowledged: false,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }

      // Check frontend errors from admin logs
      const recentLogs = adminLogger.getLogs({ level: 'error', limit: 5 })
      recentLogs.forEach(log => {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        if (log.timestamp.getTime() > fiveMinutesAgo) {
          errors.push({
            id: `frontend-${log.id}`,
            title: 'Frontend Error Detected',
            message: log.message,
            level: 'error',
            source: 'frontend',
            timestamp: log.timestamp,
            acknowledged: false,
            details: log.data
          })
        }
      })

      // Check for deployment warnings
      const warnings = adminLogger.getLogs({ level: 'warn', limit: 3 })
      warnings.forEach(log => {
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
        if (log.timestamp.getTime() > tenMinutesAgo) {
          errors.push({
            id: `warning-${log.id}`,
            title: 'System Warning',
            message: log.message,
            level: 'warning',
            source: 'system',
            timestamp: log.timestamp,
            acknowledged: false,
            details: log.data
          })
        }
      })

      // Update notifications (merge with existing, avoid duplicates)
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const newNotifications = errors.filter(error => !existingIds.has(error.id))
        const merged = [...prev, ...newNotifications]
        
        // Sort by timestamp (newest first) and limit
        return merged
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, maxNotifications)
      })

      if (errors.length > 0) {
        adminLogger.info('ERROR_NOTIFICATIONS', `Found ${errors.length} new errors/warnings`)
      }
    } catch (error) {
      adminLogger.logError('error_notifications_check', error as Error)
    }
  }

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, acknowledged: true }
          : notification
      )
    )
    adminLogger.logUserAction('acknowledge_notification', id)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    adminLogger.logUserAction('clear_all_notifications', 'error_notifications')
  }

  const clearAcknowledged = () => {
    setNotifications(prev => prev.filter(n => !n.acknowledged))
    adminLogger.logUserAction('clear_acknowledged_notifications', 'error_notifications')
  }

  useEffect(() => {
    if (!isAdmin) return

    checkForErrors()
    const interval = setInterval(checkForErrors, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [isAdmin])

  if (!isAdmin) {
    return null
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'error') return notification.level === 'error'
    if (filter === 'warning') return notification.level === 'warning'
    return true
  })

  const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length
  const errorCount = notifications.filter(n => n.level === 'error' && !n.acknowledged).length

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20 border-red-700'
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700'
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-700'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'vercel':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 19.777h20L12 2z"/>
          </svg>
        )
      case 'coolify':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        )
      case 'api':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'frontend':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Tikko'
    if (diffMins < 60) return `Pirms ${diffMins} min`
    if (diffMins < 1440) return `Pirms ${Math.floor(diffMins / 60)} h`
    return timestamp.toLocaleDateString('en-US')
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-white">Error Notifications</h3>
            {errorCount > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                {errorCount} errors
              </span>
            )}
            {unacknowledgedCount > 0 && (
              <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                {unacknowledgedCount} unread
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {isExpanded ? 'Sakļaut' : 'Izvērst'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-2 py-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 rounded"
            >
              <option value="all">Visi</option>
              <option value="error">Errors</option>
              <option value="warning">Brīdinājumi</option>
            </select>
            <button
              onClick={clearAcknowledged}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Delete apstiprinātos
            </button>
            <button
              onClick={clearAllNotifications}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
            >
              Delete visus
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isExpanded && (
        <div className="p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {filter === 'all' ? 'Nav kļūdu paziņojumu' : `Nav ${filter === 'error' ? 'kļūdu' : 'brīdinājumu'}`}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-3 transition-all ${
                    notification.acknowledged 
                      ? 'opacity-60 bg-gray-900/30' 
                      : `${getLevelColor(notification.level)}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2 mt-0.5">
                        {getSourceIcon(notification.source)}
                        <span className="text-xs uppercase font-medium">
                          {notification.source}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.details && (
                            <button
                              onClick={() => {
                                logger.info('COMPONENT', 'Notification details:', { details: notification.details });
                                adminLogger.info('NOTIFICATION_DETAILS', 'Details viewed', notification.details)
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              View detaļas
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {!notification.acknowledged && (
                        <button
                          onClick={() => acknowledgeNotification(notification.id)}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                          Apstiprināt
                        </button>
                      )}
                      {notification.acknowledged && (
                        <span className="text-xs text-green-400">✓ Apstiprināts</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary when collapsed */}
      {!isExpanded && (
        <div className="p-4">
          {notifications.length === 0 ? (
            <div className="text-center text-green-400 py-2">
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Visas sistēmas darbojas normāli
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <div className="flex space-x-4">
                <span className="text-red-400">
                  {notifications.filter(n => n.level === 'error').length} errors
                </span>
                <span className="text-yellow-400">
                  {notifications.filter(n => n.level === 'warning').length} brīdinājumi
                </span>
              </div>
              {unacknowledgedCount > 0 && (
                <span className="text-orange-400">
                  {unacknowledgedCount} neapstiprināti
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}