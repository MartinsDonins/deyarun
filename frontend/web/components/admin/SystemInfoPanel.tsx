import { useState } from 'react'
import { useVersionInfo } from '../../hooks/useVersionInfo'
import { useHealthCheck } from '../../hooks/useApi'
import VersionIndicator from '../VersionIndicator'
import CoolifyStatusIndicator, { CoolifyServiceStatus } from './CoolifyStatusIndicator'
import DeploymentStatus from './DeploymentStatus'
import ServerInfo from './ServerInfo'

interface SystemInfoPanelProps {
  className?: string
}

export default function SystemInfoPanel({ className = '' }: SystemInfoPanelProps) {
  const { versions, systemHealth, loading: versionLoading, error: versionError, lastUpdated, refresh: refreshVersions } = useVersionInfo()
  const { isHealthy, healthData } = useHealthCheck()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-adaptive-light'
    }
  }

  const getHealthBg = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-900/30 border-green-700'
      case 'warning': return 'bg-yellow-900/30 border-yellow-700'
      case 'critical': return 'bg-red-900/30 border-red-700'
      default: return 'bg-gray-900/30 border-gray-700'
    }
  }

  const systemHealthStatus = isHealthy ? 'healthy' : 'warning'

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main System Status - Compact */}
      <div className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${getHealthBg(systemHealthStatus)}`} 
           onClick={() => toggleSection('system')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${systemHealthStatus === 'healthy' ? 'bg-green-400' : systemHealthStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <h3 className={`text-lg font-medium text-adaptive-white`}>
              Sistēmas stāvoklis
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            {/* Essential Status Indicators */}
            <div className="flex items-center space-x-3 text-xs">
              <VersionIndicator
                label="FE"
                version={versions.frontend}
                loading={versionLoading}
                error={!!versionError}
                color="blue"
                compact
              />
              <VersionIndicator
                label="BE"
                version={versions.backend}
                loading={versionLoading}
                error={!!versionError}
                color="green"
                compact
              />
              <CoolifyStatusIndicator size="sm" showLabel={false} />
            </div>
            <span className={`text-sm font-medium ${getHealthColor(systemHealthStatus)}`}>
              {systemHealthStatus === 'healthy' ? 'Veselīgs' : 'Brīdinājums'}
            </span>
            <button className="text-adaptive-light hover:text-adaptive-white transition-colors p-1">
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'system' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {expandedSection === 'system' && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Quick Status Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-adaptive-light">API:</span>
                <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                  {isHealthy ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-adaptive-light">DB:</span>
                <span className="text-green-400">MongoDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-adaptive-light">SSL:</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-adaptive-light">Uptime:</span>
                <span className="text-green-400">99.8%</span>
              </div>
            </div>

            {/* Detailed Version Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <VersionIndicator
                label="Frontend"
                version={versions.frontend}
                loading={versionLoading}
                error={!!versionError}
                color="blue"
              />
              <VersionIndicator
                label="Backend"
                version={versions.backend}
                loading={versionLoading}
                error={!!versionError}
                color="green"
              />
              <VersionIndicator
                label="Mobile"
                version={versions.mobile}
                loading={versionLoading}
                error={!!versionError}
                color="purple"
              />
            </div>
            
            {/* Coolify Services Status */}
            <div>
              <h5 className="text-sm font-medium text-adaptive-white mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
                Coolify Deployment
              </h5>
              <CoolifyServiceStatus />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-adaptive-light">
                Last check: {lastUpdated ? lastUpdated.toLocaleTimeString('en-US') : 'Not detected'}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  refreshVersions()
                }}
                disabled={versionLoading}
                className="text-xs px-3 py-1 bg-purple-600/50 hover:bg-purple-600/70 text-white rounded transition-colors disabled:opacity-50"
              >
                {versionLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deployment & Server Info - Collapsible */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-4 cursor-pointer transition-colors hover:bg-gray-800/60" 
           onClick={() => toggleSection('deployment')}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-adaptive-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            Deployment & Server Info
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-green-400">Coolify</span>
            </div>
            <button className="text-adaptive-light hover:text-adaptive-white transition-colors p-1">
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'deployment' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {expandedSection === 'deployment' && (
          <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
            <DeploymentStatus />
            <ServerInfo />
          </div>
        )}
      </div>
    </div>
  )
}