import { useState, useEffect } from 'react'
import { getAuthToken } from '../../lib/auth'
import { logger } from '../../lib/productionLogger';
import { 
  ServerIcon, 
  GlobeAltIcon, 
  CpuChipIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface NetworkInterface {
  address: string
  family: string
  netmask: string
  mac: string
}

interface ServerNetworkInfo {
  hostname: string
  platform: string
  architecture: string
  nodeVersion: string
  uptime: number
  loadAverage: number[]
  memory: {
    total: number
    free: number
    used: number
  }
  cpus: number
  networkInterfaces: { [key: string]: NetworkInterface[] }
  localIPs: Array<{
    interface: string
    address: string
    netmask: string
  }>
  publicIP?: string
}

export default function ServerInfo() {
  const [serverInfo, setServerInfo] = useState<ServerNetworkInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchServerInfo()
  }, [])

  const fetchServerInfo = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/server-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setServerInfo(result.serverInfo)
      } else {
        throw new Error(result.message || 'API error')
      }
    } catch (err) {
      logger.error('ERROR', 'Error fetching server info:', { error: err })
      setError('Nevarēja ielādēt servera informāciju')
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatMemory = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const formatLoadAverage = (load: number[]) => {
    return load.map(l => l.toFixed(2)).join(', ')
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <ServerIcon className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Servera info</h3>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!serverInfo) return null

  return (
    <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ServerIcon className="w-6 h-6 text-coral" />
          <h3 className="text-lg font-semibold text-white">Servera informācija</h3>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
        >
          {showDetails ? 'Paslēpt' : 'Detaļas'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* External/Public IP Addresses */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="w-4 h-4 text-coral" />
            <span className="text-sm font-medium text-gray-300">Ārējās IP adreses:</span>
          </div>
          
          {/* Public IP */}
          {serverInfo.publicIP && (
            <div className="space-y-1 mb-2">
              <div className="text-xs text-gray-400 mb-1">Publiskā IP:</div>
              <div className="flex items-center justify-between bg-blue-900/20 border border-blue-700 px-3 py-2 rounded">
                <div className="flex flex-col">
                  <span className="text-blue-400 font-mono text-sm">{serverInfo.publicIP}</span>
                  <span className="text-xs text-gray-500">Publiskā (External)</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(serverInfo.publicIP!)}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
                >
                  Kopēt
                </button>
              </div>
            </div>
          )}

          {/* External IPv4 from server interfaces */}
          {serverInfo.publicIP ? (
            <div className="space-y-1">
              <div className="text-xs text-gray-400 mb-1">Servera ārējā IPv4:</div>
              <div className="flex items-center justify-between bg-green-900/20 border border-green-700 px-3 py-2 rounded">
                <div className="flex flex-col">
                  <span className="text-green-400 font-mono text-sm">{serverInfo.publicIP}</span>
                  <span className="text-xs text-gray-500">Servera ārējā IPv4</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(serverInfo.publicIP!)}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
                >
                  Kopēt
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nav pieejamas ārējās IPv4 adreses</p>
          )}
        </div>

        {/* Internal IP Addresses */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ServerIcon className="w-4 h-4 text-coral" />
            <span className="text-sm font-medium text-gray-300">Iekšējās IP adreses:</span>
          </div>
          
          {serverInfo.localIPs?.length > 0 ? (
            <div className="space-y-1">
              <div className="text-xs text-gray-400 mb-1">Lokālās IPv4:</div>
              {serverInfo.localIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-700 px-3 py-2 rounded">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-mono text-sm">{ip.address}</span>
                    <span className="text-xs text-gray-500">{ip.interface} - {ip.netmask}</span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(ip.address)}
                    className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
                  >
                    Kopēt
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nav pieejamas iekšējās IPv4 adreses</p>
          )}
        </div>
      </div>

      {/* System Info Section */}
      <div className="mt-4">
        <div className="flex items-center space-x-2 mb-3">
          <CpuChipIcon className="w-4 h-4 text-coral" />
          <span className="text-sm font-medium text-gray-300">Sistēmas informācija:</span>
        </div>
        <div className="bg-gray-700/50 px-4 py-3 rounded text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-gray-300">
              <span className="text-gray-500">Hostname:</span>
              <div className="font-mono text-coral mt-1">{serverInfo.hostname}</div>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Platform:</span>
              <div className="font-mono text-blue-400 mt-1">{serverInfo.platform}</div>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">CPU cores:</span>
              <div className="font-mono text-green-400 mt-1">{serverInfo.cpus}</div>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Node.js:</span>
              <div className="font-mono text-purple-400 mt-1">{serverInfo.nodeVersion}</div>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-600 pt-4 space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 px-4 py-3 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Uptime</span>
              </div>
              <p className="text-blue-400 font-mono text-sm">{formatUptime(serverInfo.uptime)}</p>
            </div>

            <div className="bg-gray-700/50 px-4 py-3 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-300">Load Average</span>
              </div>
              <p className="text-yellow-400 font-mono text-sm">{formatLoadAverage(serverInfo.loadAverage)}</p>
            </div>

            <div className="bg-gray-700/50 px-4 py-3 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Memory</span>
              </div>
              <p className="text-green-400 font-mono text-sm">
                {formatMemory(serverInfo.memory.free)} / {formatMemory(serverInfo.memory.total)}
              </p>
            </div>
          </div>

          {/* Network Interfaces */}
          {Object.keys(serverInfo.networkInterfaces).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Tīkla interfeisi:</h4>
              <div className="space-y-2">
                {Object.entries(serverInfo.networkInterfaces).map(([interfaceName, addresses]) => 
                  addresses.length > 0 && (
                    <div key={interfaceName} className="bg-gray-700/50 px-3 py-2 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-coral font-mono text-sm">{interfaceName}</span>
                      </div>
                      {addresses.map((addr, index) => (
                        <div key={index} className="text-xs text-gray-400 ml-4">
                          {addr.address} ({addr.family})
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 italic">
            💡 Izmantojiet šīs IP adreses, lai konfigurētu Coolify API ierobežojumus droša piekļuvē
          </div>
        </div>
      )}

      <button
        onClick={fetchServerInfo}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Refresh servera info'}
      </button>
    </div>
  )
}