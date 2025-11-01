import { useState, useEffect } from 'react'
import { adminLogger, LogEntry } from '../../lib/logger'
import { useAuth } from '../../contexts/AuthContext'

interface LogViewerProps {
  className?: string
}

export default function LogViewer({ className = '' }: LogViewerProps) {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filters, setFilters] = useState({
    level: '' as LogEntry['level'] | '',
    category: '',
    search: '',
    limit: 100
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!isAdmin) return

    const refreshLogs = () => {
      const filteredLogs = adminLogger.getLogs({
        level: filters.level || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        limit: filters.limit
      })
      setLogs(filteredLogs)
    }

    refreshLogs()
    
    // Refresh logs every 2 seconds to show new entries
    const interval = setInterval(refreshLogs, 2000)
    return () => clearInterval(interval)
  }, [isAdmin, filters])

  if (!isAdmin) {
    return null
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20'
      case 'warn': return 'text-yellow-400 bg-yellow-900/20'
      case 'info': return 'text-blue-400 bg-blue-900/20'
      case 'debug': return 'text-gray-400 bg-gray-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleExport = () => {
    const exportData = adminLogger.exportLogs()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `runacademy-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm('Vai tiešām vēlaties dzēst visus logus?')) {
      adminLogger.clearLogs()
      setLogs([])
    }
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-white">Admin Logs</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {isExpanded ? 'Sakļaut' : 'Izvērst'}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {logs.length} ieraksti
            </span>
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              Eksportēt
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Līmenis
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Visi</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kategorija
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                placeholder="API_CALL, ERROR, utt."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Meklēt
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Meklējamais teksts..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Limits
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Logs List */}
      {isExpanded && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Nav pieejami logi
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <LogEntryComponent key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary when collapsed */}
      {!isExpanded && (
        <div className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-4">
              <span className="text-red-400">
                {logs.filter(l => l.level === 'error').length} errors
              </span>
              <span className="text-yellow-400">
                {logs.filter(l => l.level === 'warn').length} brīdinājumi
              </span>
              <span className="text-blue-400">
                {logs.filter(l => l.level === 'info').length} info
              </span>
            </div>
            <span className="text-gray-400">
              Pēdējais: {logs[0] ? formatTimestamp(logs[0].timestamp) : 'Nav'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

interface LogEntryComponentProps {
  log: LogEntry
}

function LogEntryComponent({ log }: LogEntryComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20'
      case 'warn': return 'text-yellow-400 bg-yellow-900/20'
      case 'info': return 'text-blue-400 bg-blue-900/20'
      case 'debug': return 'text-gray-400 bg-gray-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="bg-gray-900/50 rounded p-3 border border-gray-700">
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
              {log.level.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {log.category}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(log.timestamp)}
            </span>
          </div>
          <div className="text-sm text-gray-200">
            {log.message}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-200 ml-2">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-400 mb-1">URL:</div>
              <div className="text-gray-300 font-mono break-all">{log.url}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Pilns laiks:</div>
              <div className="text-gray-300 font-mono">{log.timestamp.toISOString()}</div>
            </div>
          </div>
          
          {log.data && (
            <div className="mt-3">
              <div className="text-gray-400 mb-1">Dati:</div>
              <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}