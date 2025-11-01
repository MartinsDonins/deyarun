import React, { useState } from 'react';
import { logger } from '../../lib/productionLogger'
import {
  DocumentArrowDownIcon,
  CloudArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  formats: string[];
  estimatedSize: string;
}

interface ExportRequest {
  id: string;
  type: string;
  format: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  createdAt: string;
  error?: string;
}

const DataExport: React.FC = () => {
  const [selectedExport, setSelectedExport] = useState<string>('workouts');
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [includeOptions, setIncludeOptions] = useState({
    gps: false,
    analytics: true,
    goals: true,
    charts: true
  });
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      id: 'workouts',
      name: 'Workout Data',
      description: 'Export your workout history, performance metrics, and GPS data',
      icon: DocumentTextIcon,
      formats: ['csv', 'xlsx', 'json'],
      estimatedSize: '2-5 MB'
    },
    {
      id: 'analytics',
      name: 'Analytics Report',
      description: 'Comprehensive analytics report with charts and insights',
      icon: ChartBarIcon,
      formats: ['pdf', 'json'],
      estimatedSize: '1-3 MB'
    },
    {
      id: 'goals',
      name: 'Goals & Progress',
      description: 'Your goals, milestones, and progress tracking data',
      icon: TableCellsIcon,
      formats: ['csv', 'xlsx', 'json'],
      estimatedSize: '< 1 MB'
    },
    {
      id: 'complete',
      name: 'Complete Export',
      description: 'All your data in one comprehensive package',
      icon: ArchiveBoxIcon,
      formats: ['zip', 'json'],
      estimatedSize: '5-15 MB'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const token = localStorage.getItem('token');
      const exportType = selectedExport;
      const format = selectedFormat;
      
      // Build query parameters
      const params = new URLSearchParams({
        format,
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
        ...(exportType === 'workouts' && { includeGPS: includeOptions.gps.toString() }),
        ...(exportType === 'analytics' && { includeCharts: includeOptions.charts.toString() })
      });

      let endpoint = '';
      switch (exportType) {
        case 'workouts':
          endpoint = '/api/data-export/workouts';
          break;
        case 'analytics':
          endpoint = '/api/data-export/analytics';
          break;
        case 'goals':
          endpoint = '/api/data-export/goals';
          break;
        case 'complete':
          endpoint = '/api/data-export/complete';
          break;
      }

      logger.info('COMPONENT', '📤 Starting export: ${exportType} (${format})');

      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // For immediate downloads
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `${exportType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Add to export requests list
        const newRequest: ExportRequest = {
          id: `export_${Date.now()}`,
          type: exportType,
          format,
          status: 'completed',
          progress: 100,
          createdAt: new Date().toISOString()
        };

        setExportRequests(prev => [newRequest, ...prev.slice(0, 4)]);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      logger.error('ERROR', '❌ Export error:', { error: error });
      
      // Add failed request to list
      const failedRequest: ExportRequest = {
        id: `export_${Date.now()}`,
        type: selectedExport,
        format: selectedFormat,
        status: 'failed',
        progress: 0,
        createdAt: new Date().toISOString(),
        error: 'Export failed. Please try again.'
      };

      setExportRequests(prev => [failedRequest, ...prev.slice(0, 4)]);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'queued':
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const selectedOption = exportOptions.find(option => option.id === selectedExport);

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <DocumentArrowDownIcon className="w-5 h-5 mr-2 text-blue-500" />
          Export Your Data
        </h3>

        {/* Export Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                onClick={() => {
                  setSelectedExport(option.id);
                  setSelectedFormat(option.formats[0]);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedExport === option.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-white">{option.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">Est. Size: {option.estimatedSize}</span>
                      <div className="flex space-x-1">
                        {option.formats.map(format => (
                          <span
                            key={format}
                            className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                          >
                            {format.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export Configuration */}
        {selectedOption && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Export Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectedOption.formats.map(format => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                    {format === 'csv' && ' - Spreadsheet format'}
                    {format === 'xlsx' && ' - Excel format'}
                    {format === 'json' && ' - Raw data format'}
                    {format === 'pdf' && ' - Report format'}
                    {format === 'zip' && ' - Compressed archive'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Include Options
              </label>
              <div className="grid grid-cols-2 gap-3">
                {selectedExport === 'workouts' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeOptions.gps}
                      onChange={(e) => setIncludeOptions(prev => ({ ...prev, gps: e.target.checked }))}
                      className="rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">GPS Data</span>
                  </label>
                )}
                {selectedExport === 'analytics' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeOptions.charts}
                      onChange={(e) => setIncludeOptions(prev => ({ ...prev, charts: e.target.checked }))}
                      className="rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Charts & Graphs</span>
                  </label>
                )}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="w-5 h-5 mr-2" />
                  Export {selectedOption.name}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Recent Exports */}
      {exportRequests.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Exports</h3>
          <div className="space-y-3">
            {exportRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="text-sm font-medium text-white capitalize">
                      {request.type.replace('_', ' ')} Export ({request.format.toUpperCase()})
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                    </p>
                    {request.error && (
                      <p className="text-xs text-red-400">{request.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-medium text-white mb-2">🔒 Privacy & Security</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Your exported data contains personal fitness information</li>
          <li>• Files are generated on-demand and not stored on our servers</li>
          <li>• GPS data includes precise location coordinates if enabled</li>
          <li>• Please store exported files securely and only share with trusted parties</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExport;