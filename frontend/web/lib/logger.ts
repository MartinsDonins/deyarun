import { logger } from '../lib/productionLogger'
interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  message: string
  data?: any
  userId?: string
  userRole?: string
  url?: string
  userAgent?: string
}

class AdminLogger {
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  private isAdmin: boolean = false
  private storageKey = 'runacademy_admin_logs'

  constructor() {
    // Load existing logs from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      this.loadLogs()
    }
  }

  setAdminStatus(isAdmin: boolean, userRole?: string) {
    this.isAdmin = isAdmin
    if (!isAdmin) {
      // Clear logs if user is not admin
      this.logs = []
      this.saveLogs()
    }
  }

  private loadLogs() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load admin logs:', { error: error })
      this.logs = []
    }
  }

  private saveLogs() {
    if (!this.isAdmin || typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (error) {
      logger.error('ERROR', 'Failed to save admin logs:', { error: error })
    }
  }

  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    if (!this.isAdmin) return

    const logEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    }

    this.logs.unshift(logEntry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    this.saveLogs()
    
    // Also log to console for immediate debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[ADMIN LOG] ${category}: ${message}`, data)
    }
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data)
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data)
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data)
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data)
  }

  // API call logging helpers
  logApiCall(endpoint: string, method: string, params?: any) {
    this.info('API_CALL', `${method} ${endpoint}`, { params })
  }

  logApiResponse(endpoint: string, status: number, data?: any, error?: any) {
    if (error || status >= 400) {
      this.error('API_RESPONSE', `${endpoint} failed with status ${status}`, { status, data, error })
    } else {
      this.info('API_RESPONSE', `${endpoint} succeeded with status ${status}`, { status, dataSize: data ? JSON.stringify(data).length : 0 })
    }
  }

  logDataTransformation(source: string, description: string, input?: any, output?: any) {
    this.debug('DATA_TRANSFORM', `${source}: ${description}`, { 
      inputType: typeof input,
      outputType: typeof output,
      inputSize: input ? JSON.stringify(input).length : 0,
      outputSize: output ? JSON.stringify(output).length : 0
    })
  }

  logUserAction(action: string, target?: string, data?: any) {
    this.info('USER_ACTION', `${action}${target ? ` on ${target}` : ''}`, data)
  }

  logError(source: string, error: Error | string, context?: any) {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined
    
    this.error('ERROR', `${source}: ${errorMessage}`, {
      errorStack,
      context
    })
  }

  // Get logs for display
  getLogs(filters?: {
    level?: LogEntry['level']
    category?: string
    search?: string
    limit?: number
  }): LogEntry[] {
    if (!this.isAdmin) return []

    let filteredLogs = [...this.logs]

    if (filters?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }

    if (filters?.category) {
      filteredLogs = filteredLogs.filter(log => log.category.includes(filters.category!))
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search) ||
        log.category.toLowerCase().includes(search) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(search))
      )
    }

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit)
    }

    return filteredLogs
  }

  clearLogs() {
    if (!this.isAdmin) return
    this.logs = []
    this.saveLogs()
  }

  exportLogs(): string {
    if (!this.isAdmin) return ''
    return JSON.stringify(this.logs, null, 2)
  }
}

// Create singleton instance
export const adminLogger = new AdminLogger()

// Export types for components
export type { LogEntry }