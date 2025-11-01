import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import { useApi } from '../../hooks/useApi';
import { logger } from '../../lib/productionLogger'

interface BugReport {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  userEmail?: string;
  userName?: string;
  deviceInfo?: {
    platform: string;
    osVersion?: string;
    appVersion?: string;
    deviceModel?: string;
  };
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  adminNotes: Array<{
    note: string;
    adminName: string;
    createdAt: string;
  }>;
  resolution?: {
    description: string;
    resolvedBy: {
      name: string;
    };
    resolvedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BugReportStats {
  overview: {
    total: number;
    open: number;
    thisWeek: number;
    thisMonth: number;
  };
  breakdown: {
    byCategory: Array<{ _id: string; count: number }>;
    byPriority: Array<{ _id: string; count: number }>;
    byStatus: Array<{ _id: string; count: number }>;
  };
}

const categoryLabels: Record<string, string> = {
  'crash': 'Application error',
  'performance': 'Veiktspējas problēma',
  'ui_bug': 'Design error',
  'login_issue': 'Login issue',
  'gps_tracking': 'GPS problēma',
  'sync_issue': 'Sinhronizācijas problēma',
  'feature_request': 'Funkcionalitātes pieprasījums',
  'other': 'Cits'
};

const statusLabels: Record<string, string> = {
  'open': 'Atvērts',
  'in_progress': 'Procesā',
  'resolved': 'Atrisināts',
  'closed': 'Slēgts',
  'duplicate': 'Dublikāts'
};

const priorityLabels: Record<string, string> = {
  'low': 'Zema',
  'medium': 'Vidēja',
  'high': 'Augsta',
  'critical': 'Kritiska'
};

const priorityColors: Record<string, string> = {
  'low': 'text-green-300 bg-green-800',
  'medium': 'text-yellow-300 bg-yellow-800',
  'high': 'text-orange-300 bg-orange-800',
  'critical': 'text-red-300 bg-red-800'
};

const statusColors: Record<string, string> = {
  'open': 'text-red-300 bg-red-800',
  'in_progress': 'text-blue-300 bg-blue-800',
  'resolved': 'text-green-300 bg-green-800',
  'closed': 'text-gray-300 bg-gray-700',
  'duplicate': 'text-purple-300 bg-purple-800'
};

export default function BugReportsPage() {
  const router = useRouter();
  const { request } = useApi();
  
  // State
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [stats, setStats] = useState<BugReportStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Update form for selected report
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    adminNote: '',
    resolution: ''
  });

  // Load data
  useEffect(() => {
    loadBugReports();
    loadStatistics();
  }, [currentPage, filters]);

  const loadBugReports = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      logger.info('COMPONENT', '🔍 Loading bug reports with query:', { query: queryParams.toString() });
      const response = await request(`/api/bug-reports/admin?${queryParams}`, {
        method: 'GET'
      });

      logger.info('COMPONENT', '📋 Bug reports API response:', { response });

      if (response.success && response.data) {
        logger.info('COMPONENT', '✅ Bug reports data:', { count: response.data.bugReports?.length || 0, message: 'items found' });
        logger.info('COMPONENT', '📊 Total items from API:', { totalItems: response.data.pagination?.totalItems || 0 });
        setBugReports(response.data.bugReports || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        logger.error('ERROR', '❌ Failed to load bug reports:', { error: response.message });
        setBugReports([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading bug reports:', { error: error });
      setBugReports([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await request('/api/bug-reports/admin/statistics', {
        method: 'GET'
      });

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        logger.error('ERROR', 'Failed to load statistics:', { error: response.message });
        setStats(null);
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading statistics:', { error: error });
      setStats(null);
    }
  };

  const openDetailModal = async (reportId: string) => {
    try {
      const response = await request(`/api/bug-reports/admin/${reportId}`, {
        method: 'GET'
      });

      if (response.success) {
        setSelectedReport(response.data);
        setUpdateForm({
          status: response.data.status,
          priority: response.data.priority,
          adminNote: '',
          resolution: response.data.resolution?.description || ''
        });
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading bug report details:', { error: error });
    }
  };

  const updateBugReport = async () => {
    if (!selectedReport) return;
    
    try {
      setUpdating(true);
      
      const updateData: any = {};
      
      if (updateForm.status !== selectedReport.status) {
        updateData.status = updateForm.status;
      }
      
      if (updateForm.priority !== selectedReport.priority) {
        updateData.priority = updateForm.priority;
      }
      
      if (updateForm.adminNote.trim()) {
        updateData.adminNote = updateForm.adminNote.trim();
      }
      
      if (updateForm.status === 'resolved' && updateForm.resolution.trim()) {
        updateData.resolution = updateForm.resolution.trim();
      }

      const response = await request(`/api/bug-reports/admin/${selectedReport._id}`, {
        method: 'PUT',
        data: updateData
      });

      if (response.success) {
        // Update the bug report in the list
        setBugReports(reports => 
          reports.map(report => 
            report._id === selectedReport._id ? response.data : report
          )
        );
        
        setSelectedReport(response.data);
        setUpdateForm(prev => ({ ...prev, adminNote: '' }));
        
        // Reload statistics
        loadStatistics();
        
        alert('Errors ziņojums veiksmīgi atjaunināts!');
      } else {
        alert('Error atjauninot ziņojumu: ' + response.message);
      }
    } catch (error) {
      logger.error('ERROR', 'Error updating bug report:', { error: error });
      alert('Error atjauninot ziņojumu');
    } finally {
      setUpdating(false);
    }
  };

  const deleteBugReport = async (reportId: string) => {
    if (!confirm('Vai tiešām vēlaties dzēst šo errors ziņojumu?')) return;
    
    try {
      const response = await request(`/api/bug-reports/admin/${reportId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setBugReports(reports => reports.filter(report => report._id !== reportId));
        loadStatistics();
        alert('Errors ziņojums dzēsts!');
        
        if (selectedReport?._id === reportId) {
          setIsDetailModalOpen(false);
          setSelectedReport(null);
        }
      } else {
        alert('Error dzēšot ziņojumu: ' + response.message);
      }
    } catch (error) {
      logger.error('ERROR', 'Error deleting bug report:', { error: error });
      alert('Error dzēšot ziņojumu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  // Prepare table data for DataTable component
  const tableHeaders = ['Nosaukums', 'Prioritāte', 'Statuss', 'Lietotājs', 'Datums', 'Darbības'];
  
  const tableRows = bugReports.map((report) => [
    // Nosaukums
    <div key="title">
      <div className="font-medium text-gray-100 truncate max-w-xs">
        {report.title}
      </div>
      <div className="text-sm text-gray-400">
        {categoryLabels[report.category] || report.category}
      </div>
    </div>,
    // Prioritāte
    <span key="priority" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[report.priority]}`}>
      {priorityLabels[report.priority]}
    </span>,
    // Statuss
    <span key="status" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
      {statusLabels[report.status]}
    </span>,
    // Lietotājs
    <div key="user">
      <div className="text-sm font-medium text-gray-100">
        {report.userId?.name || report.userName || 'Anonīms'}
      </div>
      <div className="text-sm text-gray-400">
        {report.userId?.email || report.userEmail || 'Nav e-pasta'}
      </div>
    </div>,
    // Datums
    <div key="date" className="text-sm text-gray-100">
      {formatDate(report.createdAt)}
    </div>,
    // Darbības
    <div key="actions" className="flex space-x-2">
      <button
        onClick={() => openDetailModal(report._id)}
        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
      >
        View
      </button>
      <button
        onClick={() => deleteBugReport(report._id)}
        className="text-red-600 hover:text-red-900 text-sm font-medium"
      >
        Delete
      </button>
    </div>
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Kļūdu ziņojumi</h1>
          <p className="mt-1 text-sm text-gray-400">
            Pārvaldiet un atrisiniet lietotāju ziņotos problēmas
          </p>
        </div>

        {/* Statistics */}
        {stats && stats.overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Kopā ziņojumi"
              value={stats.overview.total || 0}
              icon="📊"
            />
            <StatCard
              title="Atvērti"
              value={stats.overview.open || 0}
              icon="🔓"
            />
            <StatCard
              title="Šonedēļ"
              value={stats.overview.thisWeek || 0}
              icon="📅"
            />
            <StatCard
              title="Šomēnes"
              value={stats.overview.thisMonth || 0}
              icon="📆"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Statuss
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Visi statusi</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kategorija
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Visas kategorijas</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prioritāte
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Visas prioritātes</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Meklēt
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Meklēt ziņojumos..."
                className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bug Reports Table */}
        <div className="bg-gray-800 shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-400">Ielādē...</div>
            </div>
          ) : bugReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400">Nav kļūdu ziņojumu</div>
            </div>
          ) : (
            <DataTable
              headers={tableHeaders}
              rows={tableRows}
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Rāda {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalItems)} no {totalItems} ziņojumiem
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                  Iepriekšējā
                </button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                  Nākamā
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Errors ziņojuma detaļas"
        >
          {selectedReport && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-3">
                  {selectedReport.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Kategorija:</span> {categoryLabels[selectedReport.category]}
                  </div>
                  <div>
                    <span className="font-medium">Prioritāte:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${priorityColors[selectedReport.priority]}`}>
                      {priorityLabels[selectedReport.priority]}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Statuss:</span>
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${statusColors[selectedReport.status]}`}>
                      {statusLabels[selectedReport.status]}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(selectedReport.createdAt)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-100 mb-2">Apraksts:</h4>
                <p className="text-gray-300 whitespace-pre-wrap bg-gray-700 p-3 rounded">
                  {selectedReport.description}
                </p>
              </div>

              {/* Steps to reproduce */}
              {selectedReport.stepsToReproduce && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Reproducēšanas soļi:</h4>
                  <p className="text-gray-300 whitespace-pre-wrap bg-gray-700 p-3 rounded">
                    {selectedReport.stepsToReproduce}
                  </p>
                </div>
              )}

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReport.expectedBehavior && (
                  <div>
                    <h4 className="font-medium text-gray-100 mb-2">Gaidītā rīcība:</h4>
                    <p className="text-gray-300 bg-green-900 p-3 rounded">
                      {selectedReport.expectedBehavior}
                    </p>
                  </div>
                )}
                {selectedReport.actualBehavior && (
                  <div>
                    <h4 className="font-medium text-gray-100 mb-2">Faktiskā rīcība:</h4>
                    <p className="text-gray-300 bg-red-900 p-3 rounded">
                      {selectedReport.actualBehavior}
                    </p>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div>
                <h4 className="font-medium text-gray-100 mb-2">Lietotāja informācija:</h4>
                <div className="bg-gray-700 p-3 rounded space-y-1 text-sm">
                  <div className="text-gray-300"><span className="font-medium text-gray-100">Vārds:</span> {selectedReport.userId?.name || selectedReport.userName || 'Nav norādīts'}</div>
                  <div className="text-gray-300"><span className="font-medium text-gray-100">E-pasts:</span> {selectedReport.userId?.email || selectedReport.userEmail || 'Nav norādīts'}</div>
                  {selectedReport.userId && (
                    <div className="text-gray-300"><span className="font-medium text-gray-100">Lietotāja ID:</span> {selectedReport.userId._id}</div>
                  )}
                </div>
              </div>

              {/* Device Info */}
              {selectedReport.deviceInfo && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Ierīces informācija:</h4>
                  <div className="bg-gray-700 p-3 rounded space-y-1 text-sm">
                    <div className="text-gray-300"><span className="font-medium text-gray-100">Platforma:</span> {selectedReport.deviceInfo.platform}</div>
                    {selectedReport.deviceInfo.osVersion && (
                      <div className="text-gray-300"><span className="font-medium text-gray-100">OS versija:</span> {selectedReport.deviceInfo.osVersion}</div>
                    )}
                    {selectedReport.deviceInfo.appVersion && (
                      <div className="text-gray-300"><span className="font-medium text-gray-100">App versija:</span> {selectedReport.deviceInfo.appVersion}</div>
                    )}
                    {selectedReport.deviceInfo.deviceModel && (
                      <div className="text-gray-300"><span className="font-medium text-gray-100">Ierīce:</span> {selectedReport.deviceInfo.deviceModel}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedReport.adminNotes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Admin komentāri:</h4>
                  <div className="space-y-2">
                    {selectedReport.adminNotes.map((note, index) => (
                      <div key={index} className="bg-blue-900 border-l-4 border-blue-400 p-3">
                        <p className="text-gray-300">{note.note}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {note.adminName} - {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedReport.resolution && (
                <div>
                  <h4 className="font-medium text-gray-100 mb-2">Risinājums:</h4>
                  <div className="bg-green-900 border-l-4 border-green-400 p-3">
                    <p className="text-gray-300">{selectedReport.resolution.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Atrisināja: {selectedReport.resolution.resolvedBy.name} - {formatDate(selectedReport.resolution.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Update Form */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-100 mb-4">Atjaunināt ziņojumu:</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Statuss
                      </label>
                      <select
                        value={updateForm.status}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Prioritāte
                      </label>
                      <select
                        value={updateForm.priority}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Admin komentārs
                    </label>
                    <textarea
                      value={updateForm.adminNote}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNote: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Pievienot komentāru..."
                    />
                  </div>

                  {updateForm.status === 'resolved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Risinājuma apraksts
                      </label>
                      <textarea
                        value={updateForm.resolution}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, resolution: e.target.value }))}
                        rows={3}
                        className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Kā tika atrisināta problēma?"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateBugReport}
                      disabled={updating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? 'Saglabā...' : 'Save izmaiņas'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}