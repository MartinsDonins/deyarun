import { useState } from 'react'
import { 
  CogIcon, 
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { DashboardConfig, DashboardWidget } from '../../hooks/useDashboardConfig'

interface DashboardCustomizerProps {
  config: DashboardConfig
  onToggleWidget: (widgetId: string) => void
  onReorderWidgets: (widgets: DashboardWidget[]) => void
  onSetLayout: (layout: 'grid' | 'list' | 'compact') => void
  onReset: () => void
  onUpdateConfig: (config: DashboardConfig) => void
  onClose?: () => void
}

export default function DashboardCustomizer({ 
  config, 
  onToggleWidget, 
  onReorderWidgets,
  onSetLayout,
  onReset,
  onUpdateConfig,
  onClose 
}: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const widgets = [...config.widgets]
    const index = widgets.findIndex(w => w.id === widgetId)
    
    if (direction === 'up' && index > 0) {
      [widgets[index - 1], widgets[index]] = [widgets[index], widgets[index - 1]]
      widgets[index - 1].order = index
      widgets[index].order = index + 1
    } else if (direction === 'down' && index < widgets.length - 1) {
      [widgets[index], widgets[index + 1]] = [widgets[index + 1], widgets[index]]
      widgets[index].order = index + 1
      widgets[index + 1].order = index + 2
    }
    
    onReorderWidgets(widgets)
  }

  const layoutOptions = [
    { value: 'grid', label: 'Režģis', icon: Squares2X2Icon },
    { value: 'list', label: 'Saraksts', icon: ListBulletIcon },
    { value: 'compact', label: 'Kompakts', icon: ViewColumnsIcon }
  ]

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-coral hover:bg-orange-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Pielāgot dashboard"
      >
        <CogIcon className="w-6 h-6" />
      </button>

      {/* Customizer Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Dashboard iestatījumi
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false)
                  onClose?.()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Layout Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Izkārtojums
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {layoutOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => onSetLayout(option.value as 'grid' | 'list' | 'compact')}
                      className={`p-3 rounded-lg border transition-all ${
                        config.layout === option.value
                          ? 'bg-coral text-white border-coral'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-coral'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Widgets List */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Rādītie elementi
              </h3>
              <div className="space-y-2">
                {config.widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget, index) => (
                    <div
                      key={widget.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onToggleWidget(widget.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {widget.enabled ? (
                            <EyeIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5" />
                          )}
                        </button>
                        <span className={`text-sm ${
                          widget.enabled 
                            ? 'text-gray-900 dark:text-white font-medium' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {widget.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            index === 0 
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          disabled={index === config.widgets.length - 1}
                          className={`p-1 rounded ${
                            index === config.widgets.length - 1 
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="mb-6 space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Rādīt sveicienu
                </span>
                <input
                  type="checkbox"
                  checked={config.showWelcome}
                  onChange={(e) => {
                    const newConfig = { ...config, showWelcome: e.target.checked }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-4 h-4 text-coral focus:ring-coral border-gray-300 rounded"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Rādīt padomus
                </span>
                <input
                  type="checkbox"
                  checked={config.showTips}
                  onChange={(e) => {
                    const newConfig = { ...config, showTips: e.target.checked }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-4 h-4 text-coral focus:ring-coral border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Automātiska atjaunošana
                </span>
                <input
                  type="checkbox"
                  checked={config.autoRefresh}
                  onChange={(e) => {
                    const newConfig = { ...config, autoRefresh: e.target.checked }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-4 h-4 text-coral focus:ring-coral border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Kompakts režīms
                </span>
                <input
                  type="checkbox"
                  checked={config.compactMode}
                  onChange={(e) => {
                    const newConfig = { ...config, compactMode: e.target.checked }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-4 h-4 text-coral focus:ring-coral border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Animācijas
                </span>
                <input
                  type="checkbox"
                  checked={config.animationsEnabled}
                  onChange={(e) => {
                    const newConfig = { ...config, animationsEnabled: e.target.checked }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-4 h-4 text-coral focus:ring-coral border-gray-300 rounded"
                />
              </label>
            </div>

            {/* Refresh Interval */}
            {config.autoRefresh && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Atjaunošanas intervāls
                </h3>
                <select
                  value={config.refreshInterval}
                  onChange={(e) => {
                    const newConfig = { ...config, refreshInterval: parseInt(e.target.value) }
                    onUpdateConfig(newConfig)
                  }}
                  className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                >
                  <option value={1}>1 minūte</option>
                  <option value={5}>5 minūtes</option>
                  <option value={10}>10 minūtes</option>
                  <option value={30}>30 minūtes</option>
                  <option value={60}>1 stunda</option>
                </select>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Refresh noklusējumu</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}