import { useState } from 'react'
import { apiService } from '../../lib/api'
import { logger } from '../../lib/productionLogger'

interface ExportConfig {
  type: 'users' | 'workouts' | 'analytics' | 'revenue' | 'subscriptions'
  format: 'csv' | 'excel' | 'pdf'
  timeRange: 'today' | '7d' | '30d' | '90d' | '1y' | 'all' | 'custom'
  customStartDate?: string
  customEndDate?: string
  includeFields: string[]
  filters?: {
    userRole?: string
    userStatus?: string
    workoutType?: string
    subscriptionStatus?: string
  }
}

interface ExportJob {
  id: string
  type: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  downloadUrl?: string
  error?: string
}

export default function ExportManager() {
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    type: 'users',
    format: 'csv',
    timeRange: '30d',
    includeFields: []
  })
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(false)

  const exportTypes = [
    { value: 'users', label: 'Lietotāju dati', icon: '👥' },
    { value: 'workouts', label: 'Treniņu dati', icon: '🏃‍♂️' },
    { value: 'analytics', label: 'Analītikas dati', icon: '📊' },
    { value: 'revenue', label: 'Ieņēmumu dati', icon: '💰' },
    { value: 'subscriptions', label: 'Abonementu dati', icon: '📋' }
  ]

  const exportFormats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel (.xlsx)' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format' }
  ]

  const timeRanges = [
    { value: 'today', label: 'Šodien' },
    { value: '7d', label: 'Pēdējās 7 dienas' },
    { value: '30d', label: 'Pēdējās 30 dienas' },
    { value: '90d', label: 'Pēdējās 90 dienas' },
    { value: '1y', label: 'Pēdējais gads' },
    { value: 'all', label: 'Visi laiki' },
    { value: 'custom', label: 'Pielāgots periods' }
  ]

  const fieldsByType = {
    users: [
      'firstName', 'lastName', 'email', 'role', 'isActive', 'createdAt', 'lastActiveAt',
      'totalWorkouts', 'totalDistance', 'averagePace', 'subscription'
    ],
    workouts: [
      'id', 'userId', 'type', 'name', 'duration', 'distance', 'pace', 'calories',
      'startedAt', 'finishedAt', 'route', 'weather'
    ],
    analytics: [
      'date', 'activeUsers', 'newUsers', 'workoutsCompleted', 'averageSessionTime',
      'retentionRate', 'conversionRate'
    ],
    revenue: [
      'date', 'subscriptionRevenue', 'oneTimeRevenue', 'refunds', 'netRevenue',
      'activeSubscriptions', 'churnRate'
    ],
    subscriptions: [
      'userId', 'planType', 'status', 'startDate', 'endDate', 'amount', 'billingCycle',
      'paymentMethod', 'lastPaymentDate'
    ]
  }

  const startExport = async () => {
    setLoading(true)
    try {
      const response = await apiService.post('/api/admin/export/create', exportConfig) as { data: ExportJob }
      const newJob: ExportJob = response.data
      setExportJobs(prev => [newJob, ...prev])
      setShowExportModal(false)
      
      // Start polling for job status
      pollJobStatus(newJob.id)
    } catch (error) {
      logger.error('ERROR', 'Error starting export:', { error: error })
      alert('Error sākot eksportu')
    } finally {
      setLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await apiService.get(`/api/admin/export/status/${jobId}`) as { data: ExportJob }
        const job: ExportJob = response.data
        
        setExportJobs(prev => 
          prev.map(j => j.id === jobId ? job : j)
        )

        if (job.status === 'processing') {
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
      } catch (error) {
        logger.error('ERROR', 'Error polling job status:', { error: error })
      }
    }
    poll()
  }

  const downloadFile = async (job: ExportJob) => {
    if (!job.downloadUrl) return

    try {
      const response = await fetch(job.downloadUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${job.type}_${job.format}_${new Date().toISOString().split('T')[0]}.${job.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      logger.error('ERROR', 'Error downloading file:', { error: error })
      alert('Error lejupielādējot failu')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'processing': return '🔄'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'processing': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Datu eksports</h2>
          <p className="text-gray-400">Eksportējiet datus dažādos formātos</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Jauns eksports
        </button>
      </div>

      {/* Export Jobs List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Eksporta darbi</h3>
        {exportJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Nav eksporta darbu
          </div>
        ) : (
          <div className="space-y-3">
            {exportJobs.map((job) => (
              <div key={job.id} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getStatusIcon(job.status)}
                    </span>
                    <div>
                      <div className="text-white font-medium">
                        {job.type} ({job.format.toUpperCase()})
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(job.createdAt).toLocaleString('lv')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status === 'pending' && 'Gaida'}
                        {job.status === 'processing' && `Apstrādā (${job.progress}%)`}
                        {job.status === 'completed' && 'Completed'}
                        {job.status === 'failed' && 'Error'}
                      </div>
                      {job.error && (
                        <div className="text-xs text-red-400">{job.error}</div>
                      )}
                    </div>
                    {job.status === 'completed' && job.downloadUrl && (
                      <button
                        onClick={() => downloadFile(job)}
                        className="btn-ghost text-coral hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {job.status === 'processing' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-coral h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Konfigurēt eksportu</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Export Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Eksporta veids</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exportTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setExportConfig({ ...exportConfig, type: type.value as any, includeFields: [] })}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          exportConfig.type === type.value
                            ? 'border-coral bg-coral/10 text-coral'
                            : 'border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{type.icon}</span>
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Faila formāts</label>
                  <div className="space-y-2">
                    {exportFormats.map((format) => (
                      <label key={format.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={exportConfig.format === format.value}
                          onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value as any })}
                          className="text-coral bg-bg border-gray-700 focus:ring-coral"
                        />
                        <div>
                          <div className="text-white font-medium">{format.label}</div>
                          <div className="text-sm text-gray-400">{format.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Laika periods</label>
                  <select
                    value={exportConfig.timeRange}
                    onChange={(e) => setExportConfig({ ...exportConfig, timeRange: e.target.value as any })}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  >
                    {timeRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                {exportConfig.timeRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">No datuma</label>
                      <input
                        type="date"
                        value={exportConfig.customStartDate || ''}
                        onChange={(e) => setExportConfig({ ...exportConfig, customStartDate: e.target.value })}
                        className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Līdz datumam</label>
                      <input
                        type="date"
                        value={exportConfig.customEndDate || ''}
                        onChange={(e) => setExportConfig({ ...exportConfig, customEndDate: e.target.value })}
                        className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Fields Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Iekļaujamie lauki</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {fieldsByType[exportConfig.type].map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportConfig({
                                ...exportConfig,
                                includeFields: [...exportConfig.includeFields, field]
                              })
                            } else {
                              setExportConfig({
                                ...exportConfig,
                                includeFields: exportConfig.includeFields.filter(f => f !== field)
                              })
                            }
                          }}
                          className="text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                        />
                        <span className="text-gray-300 text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setExportConfig({
                        ...exportConfig,
                        includeFields: fieldsByType[exportConfig.type]
                      })}
                      className="text-coral text-sm hover:text-white transition-colors"
                    >
                      Izvēlēties visus
                    </button>
                    <button
                      onClick={() => setExportConfig({ ...exportConfig, includeFields: [] })}
                      className="text-gray-400 text-sm hover:text-gray-300 transition-colors"
                    >
                      Noņemt visus
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startExport}
                    disabled={loading || exportConfig.includeFields.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {loading ? 'Sāk eksportu...' : 'Sākt eksportu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}