import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BugReportForm from '../components/BugReportForm';
import { bugReportAPI, UserBugReport } from '../lib/bugReportAPI';
import { useAuth } from '../contexts/AuthContext';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import { logger } from '../lib/productionLogger'

export default function SupportPage() {
  const [showBugReportForm, setShowBugReportForm] = useState(false);
  const [userBugReports, setUserBugReports] = useState<UserBugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadUserBugReports();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserBugReports = async () => {
    try {
      const result = await bugReportAPI.getUserBugReports(1, 5);
      if (result.success && result.data) {
        setUserBugReports(result.data.bugReports);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to load bug reports:', { error: error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBugReportSuccess = () => {
    if (user) {
      loadUserBugReports();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-coral-500';
      case 'in_progress': return 'text-blue-500';
      case 'resolved': return 'text-green-500';
      case 'closed': return 'text-gray-500';
      default: return 'text-gray-400';
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

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Atbalsts un palīdzība
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Vai jums ir problēmas ar DeyaRun? Mēs esam šeit, lai palīdzētu!
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Bug Report */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-coral-500 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Ziņot par problēmu</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Atradāt kļūdu vai problēmu? Palīdziet mums to labot!
            </p>
            <button
              onClick={() => setShowBugReportForm(true)}
              className="w-full bg-coral-600 text-white py-3 px-4 rounded-lg border-2 border-coral-500 hover:bg-coral-700 hover:border-coral-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Ziņot par kļūdu
            </button>
          </div>

          {/* FAQ */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Biežāk uzdotie jautājumi</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Atrodiet atbildes uz visbiežāk uzdotajiem jautājumiem.
            </p>
            <button
              onClick={() => router.push('/faq')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg border-2 border-blue-500 hover:bg-blue-700 hover:border-blue-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Skatīt FAQ
            </button>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-green-500 p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Sazināties ar mums</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Nepieciešama personiska palīdzība? Rakstiet mums!
            </p>
            <a
              href="mailto:info@deyarun.com"
              className="w-full block bg-green-600 text-white py-3 px-4 rounded-lg border-2 border-green-500 hover:bg-green-700 hover:border-green-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-center"
            >
              info@deyarun.com
            </a>
          </div>
        </div>

        {/* User's Bug Reports */}
        {user && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Jūsu ziņojumi</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Ielādē ziņojumus...</p>
              </div>
            ) : userBugReports.length > 0 ? (
              <div className="space-y-4">
                {userBugReports.map((report) => (
                  <div key={report._id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                      <span className={`text-sm font-medium ${getStatusColor(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{report.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{getCategoryLabel(report.category)}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <button
                    onClick={() => router.push('/bug-reports')}
                    className="inline-flex items-center px-6 py-2 border-2 border-coral-500 text-coral-500 rounded-lg hover:bg-coral-500 hover:text-white transition-all duration-200 font-medium"
                  >
                    Skatīt visus ziņojumus
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">Jums nav neviena ziņojuma.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Ziņojiet par problēmām, lai palīdzētu uzlabot DeyaRun!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Noderīgas saites</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs"
              className="bg-gray-700 text-white px-6 py-3 rounded-lg border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Dokumentācija
            </a>
            <a
              href="/privacy"
              className="bg-gray-700 text-white px-6 py-3 rounded-lg border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Privātuma politika
            </a>
            <a
              href="/terms"
              className="bg-gray-700 text-white px-6 py-3 rounded-lg border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Lietošanas noteikumi
            </a>
          </div>
        </div>
      </div>

      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={showBugReportForm}
        onClose={() => setShowBugReportForm(false)}
        onSuccess={handleBugReportSuccess}
      />
    </ProtectedLayout>
  );
}