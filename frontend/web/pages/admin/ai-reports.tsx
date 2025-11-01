import { useState, useEffect } from 'react'
import { useAuth, withAdminAuth } from '../../contexts/AuthContext'
import { getAuthToken } from '../../lib/auth'
import AdminLayout from '../../components/layout/AdminLayout'
import { logger } from '../../lib/productionLogger'

interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: any
}

interface AIConversation {
  _id: string
  sessionId: string
  userId?: string
  userEmail?: string
  conversationType: 'support' | 'training' | 'general' | 'onboarding' | 'feedback'
  messages: AIMessage[]
  summary: string
  topic: string
  tags: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  resolved: boolean
  rating?: number
  feedback?: string
  startedAt: string
  endedAt?: string
  duration: number
  messageCount: number
  isActive: boolean
  language: string
  source: 'web' | 'mobile' | 'api'
  createdAt: string
  updatedAt: string
}

interface AnalyticsData {
  totalConversations: number
  averageMessages: number
  averageDuration: number
  resolvedCount: number
  resolutionRate: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  typeBreakdown: {
    support: number
    training: number
    general: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

function AIReportsPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Filters
  const [filters, setFilters] = useState({
    conversationType: '',
    resolved: '',
    sentiment: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'

  useEffect(() => {
    fetchConversations()
    fetchAnalytics()
  }, [filters, pagination.page])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      })

      const response = await fetch(`${API_BASE_URL}/api/ai-conversations/admin/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations)
      setPagination(data.pagination)
      setError(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching conversations:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const token = getAuthToken()
      
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`${API_BASE_URL}/api/ai-conversations/admin/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)

    } catch (err) {
      logger.error('ERROR', 'Error fetching analytics:', { error: err })
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US')
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 bg-green-400/20'
      case 'negative':
        return 'text-red-400 bg-red-400/20'
      default:
        return 'text-yellow-400 bg-yellow-400/20'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'support':
        return 'text-blue-400 bg-blue-400/20'
      case 'training':
        return 'text-purple-400 bg-purple-400/20'
      case 'feedback':
        return 'text-orange-400 bg-orange-400/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }

  return (
    <AdminLayout title="AI Sarunu Atskaites">
      <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">AI Sarunu Atskaites</h1>
              <p className="text-gray-400">Apskatiet un analizējiet AI sarunu datus</p>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Kopā Sarunu</h3>
                  <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalConversations}</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Vidējais Ziņojumu Skaits</h3>
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.averageMessages}</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Atrisināšanas Līmenis</h3>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.resolutionRate}%</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Vidējais Ilgums</h3>
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{formatDuration(analytics.averageDuration)}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card mb-8">
            <h3 className="text-lg font-semibold mb-4">Filtri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tips</label>
                <select
                  value={filters.conversationType}
                  onChange={(e) => handleFilterChange('conversationType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                >
                  <option value="">Visi</option>
                  <option value="support">Atbalsts</option>
                  <option value="training">Treniņi</option>
                  <option value="general">Vispārīgi</option>
                  <option value="onboarding">Ieviešana</option>
                  <option value="feedback">Atsauksmes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Sentiments</label>
                <select
                  value={filters.sentiment}
                  onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                >
                  <option value="">Visi</option>
                  <option value="positive">Pozitīvs</option>
                  <option value="neutral">Neitrāls</option>
                  <option value="negative">Negatīvs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Atrisināts</label>
                <select
                  value={filters.resolved}
                  onChange={(e) => handleFilterChange('resolved', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                >
                  <option value="">Visi</option>
                  <option value="true">Atrisināts</option>
                  <option value="false">Nav atrisināts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">No datuma</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Līdz datumam</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Meklēt</label>
                <input
                  type="text"
                  placeholder="Meklēt sarunās..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-coral"
                />
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">AI Sarunas</h3>
              <div className="text-sm text-gray-400">
                Kopā: {pagination.total} | Lapa {pagination.page} no {pagination.totalPages}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400">Ielādē sarunas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                {error}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Nav atrasta neviena saruna</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <div 
                      key={conversation._id} 
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs ${getTypeColor(conversation.conversationType)}`}>
                              {conversation.conversationType}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(conversation.sentiment)}`}>
                              {conversation.sentiment}
                            </span>
                            {conversation.resolved && (
                              <span className="px-2 py-1 rounded text-xs text-green-400 bg-green-400/20">
                                Atrisināts
                              </span>
                            )}
                          </div>
                          <h4 className="text-white font-medium mb-1">{conversation.summary || 'Nav kopsavilkuma'}</h4>
                          <p className="text-gray-400 text-sm mb-2">{conversation.topic || 'Nav tēmas'}</p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <p>{formatDate(conversation.createdAt)}</p>
                          <p>{conversation.messageCount} ziņojumi</p>
                          {conversation.duration > 0 && <p>{formatDuration(conversation.duration)}</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>
                          {conversation.userEmail && (
                            <span>Lietotājs: {conversation.userEmail}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Avots: {conversation.source}</span>
                          <span>•</span>
                          <span>Valoda: {conversation.language}</span>
                        </div>
                      </div>

                      {conversation.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {conversation.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Iepriekšējā
                  </button>
                  
                  <span className="text-gray-400">
                    Lapa {pagination.page} no {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Nākamā
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Conversation Detail Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-bg border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Sarunas Detaļas</h3>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Conversation Info */}
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Sesijas ID:</p>
                      <p className="text-white font-mono">{selectedConversation.sessionId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Lietotājs:</p>
                      <p className="text-white">{selectedConversation.userEmail || 'Nav norādīts'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tips:</p>
                      <p className="text-white">{selectedConversation.conversationType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sentiments:</p>
                      <p className="text-white">{selectedConversation.sentiment}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sākuma laiks:</p>
                      <p className="text-white">{formatDate(selectedConversation.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Ilgums:</p>
                      <p className="text-white">{formatDuration(selectedConversation.duration)}</p>
                    </div>
                  </div>
                  
                  {selectedConversation.feedback && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Atsauksmes:</p>
                      <p className="text-white">{selectedConversation.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Ziņojumi ({selectedConversation.messages.length})</h4>
                  {selectedConversation.messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600/20 border-l-4 border-blue-500' 
                          : message.role === 'assistant'
                          ? 'bg-green-600/20 border-l-4 border-green-500'
                          : 'bg-gray-700/50 border-l-4 border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          message.role === 'user' ? 'text-blue-400' : 
                          message.role === 'assistant' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {message.role === 'user' ? 'Lietotājs' : 
                           message.role === 'assistant' ? 'AI Asistents' : 'Sistēma'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  )
}

export default withAdminAuth(AIReportsPage)