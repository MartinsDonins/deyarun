// Production Monitoring Dashboard
// Real-time monitoring of DeyaRun system health and performance

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Smartphone, 
  Server, 
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Wifi,
  WifiOff
} from 'lucide-react';

interface SystemHealth {
  backend: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    uptime: string;
    version: string;
    lastCheck: string;
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    responseTime: number;
    lastCheck: string;
  };
  mobile: {
    activeSessions: number;
    crashRate: number;
    averageSessionLength: string;
    topErrors: string[];
  };
  web: {
    activeSessions: number;
    bounceRate: number;
    averageLoadTime: number;
    topPages: string[];
  };
}

interface AlertConfig {
  id: string;
  name: string;
  type: 'critical' | 'warning' | 'info';
  condition: string;
  enabled: boolean;
  lastTriggered?: string;
}

const MonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch system health:', { error: error });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch alert configurations
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch alerts:', { error: error });
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    fetchSystemHealth();
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemHealth();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchSystemHealth, fetchAlerts]);

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Production Monitoring
            </h1>
            <p className="text-slate-300">
              Real-time system health and performance monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                autoRefresh 
                  ? 'bg-coral-500 border-coral-500 text-white' 
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>
            
            <button
              onClick={fetchSystemHealth}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-slate-400 mt-2">
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      </div>

      {systemHealth && (
        <>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Backend Health */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Server className="w-6 h-6 text-coral-500" />
                  <h3 className="text-lg font-semibold text-white">Backend</h3>
                </div>
                <div className={`flex items-center space-x-1 ${getStatusColor(systemHealth.backend.status)}`}>
                  {getStatusIcon(systemHealth.backend.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-white">{systemHealth.backend.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-white">{systemHealth.backend.uptime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Version</span>
                  <span className="text-white">{systemHealth.backend.version}</span>
                </div>
              </div>
            </div>

            {/* Database Health */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-coral-500" />
                  <h3 className="text-lg font-semibold text-white">Database</h3>
                </div>
                <div className={`flex items-center space-x-1 ${getStatusColor(systemHealth.database.status)}`}>
                  {getStatusIcon(systemHealth.database.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Connections</span>
                  <span className="text-white">{systemHealth.database.connections}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-white">{systemHealth.database.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <span className={`capitalize ${getStatusColor(systemHealth.database.status)}`}>
                    {systemHealth.database.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile App Health */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-coral-500" />
                  <h3 className="text-lg font-semibold text-white">Mobile App</h3>
                </div>
                <div className="flex items-center space-x-1 text-green-500">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Active Sessions</span>
                  <span className="text-white">{systemHealth.mobile.activeSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Crash Rate</span>
                  <span className={`${systemHealth.mobile.crashRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                    {systemHealth.mobile.crashRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg Session</span>
                  <span className="text-white">{systemHealth.mobile.averageSessionLength}</span>
                </div>
              </div>
            </div>

            {/* Web App Health */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-coral-500" />
                  <h3 className="text-lg font-semibold text-white">Web App</h3>
                </div>
                <div className="flex items-center space-x-1 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Active Sessions</span>
                  <span className="text-white">{systemHealth.web.activeSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bounce Rate</span>
                  <span className="text-white">{systemHealth.web.bounceRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Load Time</span>
                  <span className="text-white">{systemHealth.web.averageLoadTime}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Active Alerts */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-coral-500" />
                  <span>Active Alerts</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-sm">
                  {alerts.filter(a => a.enabled).length} configured
                </span>
              </div>

              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No active alerts</p>
                    <p className="text-sm">All systems operating normally</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.type === 'critical' ? 'bg-red-500' : 
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-white font-medium">{alert.name}</p>
                          <p className="text-slate-400 text-sm">{alert.condition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          alert.enabled ? 'text-green-400' : 'text-slate-400'
                        }`}>
                          {alert.enabled ? 'Active' : 'Disabled'}
                        </p>
                        {alert.lastTriggered && (
                          <p className="text-slate-400 text-xs">
                            Last: {new Date(alert.lastTriggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-coral-500" />
                <span>Performance Overview</span>
              </h3>

              <div className="space-y-6">
                {/* API Response Times */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">API Response Time</span>
                    <span className="text-white font-medium">{systemHealth.backend.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        systemHealth.backend.responseTime < 200 ? 'bg-green-500' :
                        systemHealth.backend.responseTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((systemHealth.backend.responseTime / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Database Response Times */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Database Response Time</span>
                    <span className="text-white font-medium">{systemHealth.database.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        systemHealth.database.responseTime < 100 ? 'bg-green-500' :
                        systemHealth.database.responseTime < 300 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((systemHealth.database.responseTime / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mobile Crash Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Mobile Crash Rate</span>
                    <span className="text-white font-medium">{systemHealth.mobile.crashRate}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        systemHealth.mobile.crashRate < 0.5 ? 'bg-green-500' :
                        systemHealth.mobile.crashRate < 2 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(systemHealth.mobile.crashRate * 20, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-coral-500" />
              <span>Quick Actions</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.open('https://sentry.io/organizations/coredigify/projects/', '_blank')}
                className="flex flex-col items-center space-y-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Eye className="w-6 h-6 text-coral-500" />
                <span className="text-white text-sm">View Sentry</span>
              </button>

              <button 
                onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
                className="flex flex-col items-center space-y-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-coral-500" />
                <span className="text-white text-sm">Firebase Console</span>
              </button>

              <button 
                onClick={() => window.open('https://app.logrocket.com/', '_blank')}
                className="flex flex-col items-center space-y-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Activity className="w-6 h-6 text-coral-500" />
                <span className="text-white text-sm">LogRocket</span>
              </button>

              <button
                onClick={() => window.open('https://coolify.runacademy.lv', '_blank')}
                className="flex flex-col items-center space-y-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Server className="w-6 h-6 text-coral-500" />
                <span className="text-white text-sm">Coolify</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringDashboard;