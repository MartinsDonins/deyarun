import { useCoolifyDeployment, getOverallHealthStatus } from '../../hooks/useCoolifyDeployment'

interface CoolifyStatusIndicatorProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CoolifyStatusIndicator({ 
  showLabel = true, 
  size = 'md' 
}: CoolifyStatusIndicatorProps) {
  const { status, loading, isConfigured, connectionHealthy } = useCoolifyDeployment()

  const getStatusDisplay = () => {
    if (loading) {
      return { color: 'text-gray-400', text: 'Ielādējas...', dot: 'bg-gray-400' }
    }
    
    if (!isConfigured) {
      return { color: 'text-gray-400', text: 'Nav konfigurēts', dot: 'bg-gray-400' }
    }
    
    if (!connectionHealthy) {
      return { color: 'text-red-400', text: 'Connection unavailable', dot: 'bg-red-400' }
    }

    const healthStatus = getOverallHealthStatus(status)
    
    switch (healthStatus) {
      case 'healthy':
        return { color: 'text-green-400', text: 'Veselīgs', dot: 'bg-green-400' }
      case 'degraded':
        return { color: 'text-yellow-400', text: 'Daļēji pieejams', dot: 'bg-yellow-400' }
      case 'error':
        return { color: 'text-red-400', text: 'Error', dot: 'bg-red-400' }
      default:
        return { color: 'text-gray-400', text: 'Nezināms', dot: 'bg-gray-400' }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { dot: 'w-2 h-2', text: 'text-xs' }
      case 'lg':
        return { dot: 'w-4 h-4', text: 'text-base' }
      default:
        return { dot: 'w-3 h-3', text: 'text-sm' }
    }
  }

  const statusDisplay = getStatusDisplay()
  const sizeClasses = getSizeClasses()

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizeClasses.dot} rounded-full ${statusDisplay.dot} ${loading ? 'animate-pulse' : ''}`}></div>
      {showLabel && (
        <div className="flex items-center space-x-1">
          <span className={`${sizeClasses.text} font-medium text-purple-300`}>Coolify:</span>
          <span className={`${sizeClasses.text} ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      )}
    </div>
  )
}

// Additional component for detailed service status
export function CoolifyServiceStatus() {
  const { status, loading } = useCoolifyDeployment()

  if (loading || !status || !status.available) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-300">Backend:</span>
        <span className={`${
          status.services.backend.status === 'running' ? 'text-green-400' : 
          status.services.backend.status === 'stopped' ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {status.services.backend.status}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-300">Frontend:</span>
        <span className={`${
          status.services.frontend.status === 'running' ? 'text-green-400' : 
          status.services.frontend.status === 'stopped' ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {status.services.frontend.status}
        </span>
      </div>
    </div>
  )
}