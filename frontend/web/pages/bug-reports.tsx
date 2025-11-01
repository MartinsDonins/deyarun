import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BugReportForm from '../components/BugReportForm';
import { bugReportAPI, UserBugReport } from '../lib/bugReportAPI';
import { useAuth } from '../contexts/AuthContext';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import { logger } from '../lib/productionLogger'

export default function BugReportsPage() {
  const [bugReports, setBugReports] = useState<UserBugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBugReportForm, setShowBugReportForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<UserBugReport | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadBugReports();
  }, [user, currentPage]);

  const loadBugReports = async () => {
    try {
      setIsLoading(true);
      const result = await bugReportAPI.getUserBugReports(currentPage, 10);
      if (result.success && result.data) {
        setBugReports(result.data.bugReports);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load bug reports:', { error: error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBugReportSuccess = () => {
    loadBugReports();
    setShowBugReportForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-coral-500 text-gray-900 dark:text-white';
      case 'in_progress': return 'bg-blue-500 text-gray-900 dark:text-white';
      case 'resolved': return 'bg-green-500 text-gray-900 dark:text-white';
      case 'closed': return 'bg-gray-500 text-gray-900 dark:text-white';
      default: return 'bg-gray-400 text-gray-900 dark:text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Atvērts';
      case 'in_progress': return 'Procesā';
      case 'resolved': return 'Atrisināts';
      case 'closed': return 'Slēgts';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Kritiska';
      case 'high': return 'Augsta';
      case 'medium': return 'Vidēja';
      case 'low': return 'Zema';
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'crash': 'Application error',
      'performance': 'Veiktspējas problēma',
      'ui_bug': 'Design error',
      'login_issue': 'Login issue',
      'gps_tracking': 'GPS izsekošana',
      'sync_issue': 'Datu sinhronizācija',
      'feature_request': 'Funkcionalitātes pieprasījums',
      'other': 'Cits'
    };
    return categoryMap[category] || category;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mani ziņojumi par problēmām
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Skatiet visus savus iesūtītos ziņojumus par problēmām un to statusu
            </p>
          </div>
          <button
            onClick={() => setShowBugReportForm(true)}
            className="mt-4 md:mt-0 bg-coral-600 text-gray-900 dark:text-white px-6 py-3 rounded-md hover:bg-coral-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Jauns ziņojums</span>
          </button>
        </div>

        {/* Bug Reports List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-4">Ielādē ziņojumus...</p>
          </div>
        ) : bugReports.length > 0 ? (
          <div className="space-y-4">
            {bugReports.map((report) => (
              <div 
                key={report._id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-coral/30 dark:hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{report.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{report.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Kategorija: {getCategoryLabel(report.category)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                      <span className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                        Prioritāte: {getPriorityLabel(report.priority)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Iepriekšējā
                </button>
                <span className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md">
                  {currentPage} no {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Nākamā
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nav ziņojumu</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Jums vēl nav neviena ziņojuma par problēmām.
            </p>
            <button
              onClick={() => setShowBugReportForm(true)}
              className="bg-coral-600 text-gray-900 dark:text-white px-6 py-2 rounded-md hover:bg-coral-700 transition-colors"
            >
              Izveidot pirmo ziņojumu
            </button>
          </div>
        )}
      </div>

      {/* Bug Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedReport.title}</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                    {getStatusLabel(selectedReport.status)}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(selectedReport.priority)}`}>
                    {getPriorityLabel(selectedReport.priority)} prioritāte
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Apraksts</h3>
                  <p className="text-gray-600 dark:text-gray-300">{selectedReport.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Detaļas</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Kategorija:</span>
                      <span className="text-gray-900 dark:text-white ml-2">{getCategoryLabel(selectedReport.category)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white ml-2">
                        {new Date(selectedReport.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Refreshs:</span>
                      <span className="text-gray-900 dark:text-white ml-2">
                        {new Date(selectedReport.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">ID:</span>
                      <span className="text-gray-900 dark:text-white ml-2 font-mono text-xs">{selectedReport._id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={showBugReportForm}
        onClose={() => setShowBugReportForm(false)}
        onSuccess={handleBugReportSuccess}
      />
    </ProtectedLayout>
  );
}