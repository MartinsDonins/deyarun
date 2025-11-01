import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminLogger } from '../../lib/logger'
import { getAuthToken } from '../../utils/auth'
import { logger } from '../../lib/productionLogger'

interface ServerInfoProps {
  className?: string
}

interface ServerNetworkInfo {
  hostname: string
  primaryIPs: {
    ipv4: string[]
    ipv6: string[]
  }
  coolifyRecommendation?: {
    message: string
    ipv4Addresses: string[]
    ipv6Addresses: string[]
    securityNote: string
  }
  platform: string
  architecture: string
  timestamp: string
}

export default function ServerInfoCard({ className = '' }: ServerInfoProps) {
  const { isAdmin } = useAuth()
  const [serverInfo, setServerInfo] = useState<ServerNetworkInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState('')

  const fetchServerInfo = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)
      adminLogger.info('SERVER_INFO_FETCH', 'Fetching server network information')
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/server/ip`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch server info: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setServerInfo(data.data)
        adminLogger.info('SERVER_INFO_FETCH', 'Successfully fetched server info', data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch server info')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      adminLogger.logError('server_info_fetch', err as Error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
      adminLogger.info('CLIPBOARD', `Copied ${type} to clipboard`, { text })
    } catch (err) {
      logger.error('ERROR', 'Failed to copy to clipboard:', { error: err })
    }
  }

  const formatIPList = (ips: string[]) => {
    return ips.join(', ')
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchServerInfo()
  }, [isAdmin])

  if (!isAdmin) {
    return null
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-adaptive-white">🌐 Server Network Info</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchServerInfo}
              disabled={loading}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-adaptive-white rounded text-sm transition-colors"
            >
              {loading ? '⟳' : '🔄'} Refresh
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-adaptive-white rounded text-sm transition-colors"
            >
              {isExpanded ? '▲' : '▼'} {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-adaptive-light">Loading server information...</div>
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : serverInfo ? (
          <div className="space-y-4">
            {/* Basic Server Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-adaptive-light">Hostname</div>
                <div className="text-lg font-mono text-blue-400">{serverInfo.hostname}</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-adaptive-light">Platform</div>
                <div className="text-lg text-adaptive-light">{serverInfo.platform} / {serverInfo.architecture}</div>
              </div>
            </div>

            {/* IP Addresses */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-adaptive-white">🔍 IP Addresses</h4>
              
              {serverInfo.primaryIPs.ipv4.length > 0 && (
                <div className="bg-gray-700 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-adaptive-light">IPv4 Addresses</span>
                    <button
                      onClick={() => copyToClipboard(formatIPList(serverInfo.primaryIPs.ipv4), 'ipv4')}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-adaptive-white text-xs rounded transition-colors"
                    >
                      {copied === 'ipv4' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {serverInfo.primaryIPs.ipv4.map((ip, index) => (
                      <div key={index} className="text-green-400 font-mono text-lg">{ip}</div>
                    ))}
                  </div>
                </div>
              )}

              {serverInfo.primaryIPs.ipv6.length > 0 && (
                <div className="bg-gray-700 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-adaptive-light">IPv6 Addresses</span>
                    <button
                      onClick={() => copyToClipboard(formatIPList(serverInfo.primaryIPs.ipv6), 'ipv6')}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-adaptive-white text-xs rounded transition-colors"
                    >
                      {copied === 'ipv6' ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {serverInfo.primaryIPs.ipv6.map((ip, index) => (
                      <div key={index} className="text-purple-400 font-mono text-sm break-all">{ip}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coolify Configuration Instructions */}
            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded">
              <h4 className="text-lg font-medium text-yellow-400 mb-3">🛡️ Coolify API Security Configuration</h4>
              <div className="space-y-2 text-sm">
                <p className="text-yellow-200">
                  Lai palielinātu drošību, konfigurējiet Coolify API, lai pieņemtu pieprasījumus tikai no šīm IP adresēm:
                </p>
                <div className="bg-gray-800 p-3 rounded mt-2">
                  <div className="text-adaptive-light mb-1">IP Whitelist (kopēt uz Coolify):</div>
                  <div className="font-mono text-green-400 break-all">
                    {[...serverInfo.primaryIPs.ipv4, ...serverInfo.primaryIPs.ipv6].join(', ')}
                  </div>
                  <button
                    onClick={() => copyToClipboard(
                      [...serverInfo.primaryIPs.ipv4, ...serverInfo.primaryIPs.ipv6].join(', '),
                      'whitelist'
                    )}
                    className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-adaptive-white text-xs rounded transition-colors"
                  >
                    {copied === 'whitelist' ? '✓ Copied for Coolify' : '📋 Copy IP Whitelist'}
                  </button>
                </div>
                <div className="text-xs text-yellow-300 mt-2">
                  ℹ️ Pievienojiet šīs IP adreses Coolify API iestatījumos, lai nodrošinātu maksimālu drošību
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-700 pt-4">
                <div className="text-sm text-adaptive-light space-y-2">
                  <div>Last updated: {new Date(serverInfo.timestamp).toLocaleString()}</div>
                  <div>Total IPv4 addresses: {serverInfo.primaryIPs.ipv4.length}</div>
                  <div>Total IPv6 addresses: {serverInfo.primaryIPs.ipv6.length}</div>
                  <div className="text-xs text-muted mt-2">
                    Note: Only external network interfaces are shown for security configuration
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-adaptive-light">No server information available</div>
        )}
      </div>
    </div>
  )
}