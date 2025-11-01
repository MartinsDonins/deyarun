import { useState, useEffect } from 'react'
import { logger } from '../lib/productionLogger'

export interface DashboardWidget {
  id: string
  title: string
  enabled: boolean
  order: number
  size: 'small' | 'medium' | 'large' | 'full'
}

export interface DashboardConfig {
  widgets: DashboardWidget[]
  layout: 'grid' | 'list' | 'compact'
  showWelcome: boolean
  showTips: boolean
  refreshInterval: number // minutes
  autoRefresh: boolean
  compactMode: boolean
  animationsEnabled: boolean
}

const defaultConfig: DashboardConfig = {
  widgets: [
    { id: 'profile', title: 'Profils', enabled: true, order: 1, size: 'medium' },
    { id: 'stats', title: 'Statistika', enabled: true, order: 2, size: 'full' },
    { id: 'goals', title: 'Mērķi', enabled: true, order: 3, size: 'medium' },
    { id: 'activityFeed', title: 'Aktivitātes', enabled: true, order: 4, size: 'medium' },
    { id: 'recentWorkouts', title: 'Pēdējie treniņi', enabled: true, order: 5, size: 'large' },
    { id: 'upcomingPlans', title: 'Plānotie treniņi', enabled: true, order: 6, size: 'medium' },
    { id: 'weeklyProgress', title: 'Nedēļas progress', enabled: true, order: 7, size: 'medium' },
    { id: 'personalRecords', title: 'Personīgie rekordi', enabled: true, order: 8, size: 'medium' },
    { id: 'achievements', title: 'Sasniegumi', enabled: false, order: 9, size: 'small' },
    { id: 'weather', title: 'Laika apstākļi', enabled: false, order: 10, size: 'small' },
    { id: 'strava', title: 'Strava sinhronizācija', enabled: false, order: 11, size: 'small' },
    { id: 'nutrition', title: 'Uzturs', enabled: false, order: 12, size: 'medium' },
  ],
  layout: 'grid',
  showWelcome: true,
  showTips: true,
  refreshInterval: 5,
  autoRefresh: true,
  compactMode: false,
  animationsEnabled: true
}

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // First try to load from backend
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/dashboard-config`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.config) {
            setConfig({ ...defaultConfig, ...data.config })
            return
          }
        }
      } catch (backendError) {
        logger.info('COMPONENT', 'Could not load dashboard config from backend:', { backendError })
      }

      // Fallback to localStorage
      const savedConfig = localStorage.getItem('dashboardConfig')
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig({ ...defaultConfig, ...parsedConfig })
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading dashboard config:', { error: error })
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = (newConfig: DashboardConfig) => {
    try {
      localStorage.setItem('dashboardConfig', JSON.stringify(newConfig))
      setConfig(newConfig)

      // Save to backend using httpOnly cookies
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/dashboard-config`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: newConfig })
      }).catch(err => {
        logger.info('COMPONENT', 'Could not save dashboard config to backend:', { err })
      })
    } catch (error) {
      logger.error('ERROR', 'Error saving dashboard config:', { error: error })
    }
  }

  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = config.widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    )
    saveConfig({ ...config, widgets: updatedWidgets })
  }

  const reorderWidgets = (widgets: DashboardWidget[]) => {
    saveConfig({ ...config, widgets })
  }

  const setLayout = (layout: 'grid' | 'list' | 'compact') => {
    saveConfig({ ...config, layout })
  }

  const resetToDefault = () => {
    saveConfig(defaultConfig)
  }

  return {
    config,
    isLoading,
    toggleWidget,
    reorderWidgets,
    setLayout,
    resetToDefault,
    saveConfig
  }
}