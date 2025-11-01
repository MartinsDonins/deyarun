import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import ResponsiveCard from '../../components/ui/ResponsiveCard';
import ResponsiveButton from '../../components/ui/ResponsiveButton';
import ResponsiveGrid from '../../components/ui/ResponsiveGrid';
import { useAuth, withAdminAuth } from '../../contexts/AuthContext';
import { useThemeClasses } from '../../contexts/ThemeContext';
import { getAuthToken } from '../../lib/auth';
import { logger } from '../../lib/productionLogger'
import {
  CogIcon,
  ShieldCheckIcon,
  ServerIcon,
  EnvelopeIcon,
  BellIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultLanguage: 'lv' | 'en';
    timezone: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    allowedDomains: string[];
  };
  email: {
    sendgridApiKey: string;
    fromEmail: string;
    fromName: string;
    adminEmail: string;
    enableEmailNotifications: boolean;
  };
  notifications: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSlackIntegration: boolean;
    slackWebhookUrl: string;
  };
  api: {
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    enableCors: boolean;
    allowedOrigins: string[];
  };
  integrations: {
    googleFitEnabled: boolean;
    garminEnabled: boolean;
    analyticsEnabled: boolean;
    googleAnalyticsId: string;
  };
}

type SettingsTab = 'general' | 'security' | 'email' | 'notifications' | 'api' | 'integrations';

function AdminSettingsPage() {
  const { user } = useAuth();
  const themeClasses = useThemeClasses();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        // Fallback to default settings if API fails
        setSettings({
          general: {
            siteName: 'DeyaRun',
            siteDescription: 'Personīgais skrējiena treneris un treniņu plānotājs',
            maintenanceMode: false,
            registrationEnabled: true,
            defaultLanguage: 'lv',
            timezone: 'Europe/Riga'
          },
          security: {
            sessionTimeout: 24,
            maxLoginAttempts: 5,
            passwordMinLength: 8,
            requireEmailVerification: true,
            enableTwoFactor: false,
            allowedDomains: []
          },
          email: {
            sendgridApiKey: '',
            fromEmail: 'run@coredigify.com',
            fromName: 'DeyaRun',
            adminEmail: 'admin@coredigify.com',
            enableEmailNotifications: true
          },
          notifications: {
            enablePushNotifications: true,
            enableEmailNotifications: true,
            enableSlackIntegration: false,
            slackWebhookUrl: ''
          },
          api: {
            rateLimitEnabled: true,
            rateLimitRequests: 100,
            rateLimitWindow: 60,
            enableCors: true,
            allowedOrigins: [
              'https://runacademy.lv', 
              'http://localhost:3000',
              'https://api.deyarun.com',
              'https://deyarun.com'
            ]
          },
          integrations: {
            googleFitEnabled: false,
            garminEnabled: false,
            analyticsEnabled: true,
            googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
          }
        });
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading admin settings:', { error: error });
      showMessage('error', 'Error ielādējot iestatījumus');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const savedData = await response.json();
        // Update local state with the saved settings from server
        if (savedData.success && savedData.settings) {
          setSettings(savedData.settings);
        }
        showMessage('success', 'Iestatījumi saglabāti veiksmīgi!');
        // Reload settings from server to ensure consistency
        await loadSettings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
    } catch (error) {
      logger.error('ERROR', 'Error saving admin settings:', { error: error });
      showMessage('error', 'Error saglabājot iestatījumus');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      setTestingConnection(true);
      const token = getAuthToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sendgridApiKey: settings?.email.sendgridApiKey,
          fromEmail: settings?.email.fromEmail,
          fromName: settings?.email.fromName
        })
      });

      if (response.ok) {
        showMessage('success', 'E-pasta savienojums veiksmīgs!');
      } else {
        showMessage('error', 'E-pasta savienojuma kļūda');
      }
    } catch (error) {
      showMessage('error', 'Error testējot e-pasta savienojumu');
    } finally {
      setTestingConnection(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateSettings = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    } : null);
  };

  const tabs = [
    { id: 'general', label: 'Vispārīgie', icon: CogIcon },
    { id: 'security', label: 'Drošība', icon: ShieldCheckIcon },
    { id: 'email', label: 'E-pasts', icon: EnvelopeIcon },
    { id: 'notifications', label: 'Paziņojumi', icon: BellIcon },
    { id: 'api', label: 'API', icon: ServerIcon },
    { id: 'integrations', label: 'Integrācijas', icon: GlobeAltIcon }
  ];

  if (loading) {
    return (
      <AdminLayout title="Sistēmas iestatījumi">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Ielādē iestatījumus...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout title="Sistēmas iestatījumi">
        <div className="text-center py-12">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error ielādējot iestatījumus</h3>
          <p className="text-gray-400 mb-4">Neizdevās ielādēt sistēmas iestatījumus</p>
          <ResponsiveButton onClick={loadSettings} variant="primary">
            Mēģināt vēlreiz
          </ResponsiveButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sistēmas iestatījumi">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Sistēmas iestatījumi
            </h1>
            <p className="text-gray-400">
              Pārvaldīt globālos sistēmas iestatījumus un konfigurācijas
            </p>
          </div>
          <ResponsiveButton
            onClick={saveSettings}
            loading={saving}
            variant="primary"
            icon={<CheckCircleIcon className="w-5 h-5" />}
          >
            Save izmaiņas
          </ResponsiveButton>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-900/30 text-green-300 border-green-700' 
              : message.type === 'warning'
              ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
              : 'bg-red-900/30 text-red-300 border-red-700'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
              {message.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
              {message.type === 'error' && <XCircleIcon className="w-5 h-5 mr-2" />}
              {message.text}
            </div>
          </div>
        )}

        {/* Settings Content */}
        <ResponsiveCard>
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-gray-700 mb-6 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Vispārīgie iestatījumi</h3>
                
                <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vietnes nosaukums
                    </label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Noklusējuma valoda
                    </label>
                    <select
                      value={settings.general.defaultLanguage}
                      onChange={(e) => updateSettings('general', 'defaultLanguage', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="lv">Latvian</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vietnes apraksts
                    </label>
                    <textarea
                      value={settings.general.siteDescription}
                      onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Laika josla
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="Europe/Riga">Europe/Riga (GMT+2)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                    </select>
                  </div>
                </ResponsiveGrid>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Uzturēšanas režīms</h4>
                      <p className="text-xs text-gray-500">Bloķē piekļuvi visiem lietotājiem, izņemot administratorus</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Reģistrācija iespējota</h4>
                      <p className="text-xs text-gray-500">Ļauj jauniem lietotājiem reģistrēties sistēmā</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.registrationEnabled}
                        onChange={(e) => updateSettings('general', 'registrationEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Drošības iestatījumi</h3>
                
                <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sesijas ilgums (stundas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Maksimālie ielogošanās mēģinājumi
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Minimālais paroles garums
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </ResponsiveGrid>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">E-pasta verifikācija</h4>
                      <p className="text-xs text-gray-500">Pieprasa e-pasta verifikāciju reģistrācijas laikā</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.requireEmailVerification}
                        onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Divfaktoru autentifikācija</h4>
                      <p className="text-xs text-gray-500">Iespējo 2FA visiem lietotājiem</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.enableTwoFactor}
                        onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">E-pasta iestatījumi (SendGrid)</h3>
                  <ResponsiveButton
                    onClick={testEmailConnection}
                    loading={testingConnection}
                    variant="outline"
                    size="sm"
                  >
                    Testēt savienojumu
                  </ResponsiveButton>
                </div>

                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-300">SendGrid integrācija</h4>
                      <p className="text-sm text-blue-200 mt-1">
                        Sistēma izmanto SendGrid servisu e-pasta sūtīšanai. Ievadiet SendGrid API atslēgu un konfigurējiet sūtītāja informāciju.
                      </p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SendGrid API atslēga *
                    </label>
                    <input
                      type="password"
                      value={settings.email.sendgridApiKey}
                      onChange={(e) => updateSettings('email', 'sendgridApiKey', e.target.value)}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Iegūt SendGrid API atslēgu var <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">SendGrid panelī</a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sūtītāja e-pasts *
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                      placeholder="run@coredigify.com"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      E-pasts, no kura tiks sūtīti visi sistēmas paziņojumi
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sūtītāja vārds
                    </label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                      placeholder="DeyaRun"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin e-pasts *
                    </label>
                    <input
                      type="email"
                      value={settings.email.adminEmail}
                      onChange={(e) => updateSettings('email', 'adminEmail', e.target.value)}
                      placeholder="admin@coredigify.com"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      E-pasts, uz kuru tiks sūtīti sistēmas paziņojumi (kļūdu ziņojumi, u.c.)
                    </p>
                  </div>
                </ResponsiveGrid>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">E-pasta paziņojumi iespējoti</h4>
                    <p className="text-xs text-gray-500">Sistēmas e-pasta paziņojumi caur SendGrid</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.enableEmailNotifications}
                      onChange={(e) => updateSettings('email', 'enableEmailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-300">Svarīga informācija</h4>
                      <ul className="text-sm text-yellow-200 mt-1 space-y-1">
                        <li>• SendGrid API atslēga ir nepieciešama e-pasta funkcionalitātei</li>
                        <li>• Sūtītāja e-pasts jābūt verificētam SendGrid kontā</li>
                        <li>• Pēc izmaiņu saglabāšanas, testējiet savienojumu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Paziņojumu iestatījumi</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Push paziņojumi</h4>
                      <p className="text-xs text-gray-500">Mobilās aplikācijas push paziņojumi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enablePushNotifications}
                        onChange={(e) => updateSettings('notifications', 'enablePushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Slack integrācija</h4>
                      <p className="text-xs text-gray-500">Sistēmas paziņojumi uz Slack</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableSlackIntegration}
                        onChange={(e) => updateSettings('notifications', 'enableSlackIntegration', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {settings.notifications.enableSlackIntegration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slack Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.notifications.slackWebhookUrl}
                      onChange={(e) => updateSettings('notifications', 'slackWebhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">API iestatījumi</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Rate limiting</h4>
                      <p className="text-xs text-gray-500">Ierobežo API pieprasījumu skaitu</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.api.rateLimitEnabled}
                        onChange={(e) => updateSettings('api', 'rateLimitEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">CORS iespējots</h4>
                      <p className="text-xs text-gray-500">Cross-Origin Resource Sharing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.api.enableCors}
                        onChange={(e) => updateSettings('api', 'enableCors', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {settings.api.rateLimitEnabled && (
                  <ResponsiveGrid columns={{ sm: 1, lg: 2 }} gap="md">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pieprasījumi minūtē
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.api.rateLimitRequests}
                        onChange={(e) => updateSettings('api', 'rateLimitRequests', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Laika logs (sekundes)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="3600"
                        value={settings.api.rateLimitWindow}
                        onChange={(e) => updateSettings('api', 'rateLimitWindow', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </ResponsiveGrid>
                )}

                {settings.api.enableCors && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Atļautie origins (pa vienam katrā rindā)
                    </label>
                    <textarea
                      value={settings.api.allowedOrigins.join('\n')}
                      onChange={(e) => {
                        // Process textarea value more carefully
                        const lines = e.target.value.split('\n')
                          .map(line => line.trim())
                          .filter(line => line.length > 0);
                        updateSettings('api', 'allowedOrigins', lines);
                      }}
                      rows={4}
                      placeholder={`https://runacademy.lv\nhttp://localhost:3000\nhttps://yourdomain.com`}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Katru origin ievadiet jaunā rindā. Tukšās rindas tiks ignorētas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Integrāciju iestatījumi</h3>
                
                <div className="space-y-6">
                  {/* Strava Integration */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Strava integrācija</h4>
                    
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <h5 className="text-sm font-medium text-yellow-300 mb-1">Drošības paziņojums</h5>
                          <p className="text-xs text-yellow-200">
                            Strava API konfigurācija tiek pārvaldīta caur drošiem vides mainīgajiem servera līmenī.
                            Admin panelī netiek rādīta sensitīva informācija drošības apsvērumu dēļ.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300">Strava API Status</h5>
                          <p className="text-xs text-gray-500">Integrācijas stāvoklis</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-xs text-green-400">Konfigurēts</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300">Webhook Status</h5>
                          <p className="text-xs text-gray-500">Aktivitāšu sinhronizācija</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-300 mb-2">Strava aplikācijas iestatījumi</h5>
                      <div className="text-sm text-blue-200 space-y-1">
                        <p><strong>Authorization Callback Domain:</strong> api.deyarun.com</p>
                        <p><strong>Webhook Callback URL:</strong> https://api.deyarun.com/api/strava/webhook</p>
                        <p>Šie parametri jāiestatā jūsu <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Strava aplikācijā</a></p>
                      </div>
                    </div>
                  </div>

                  {/* Google Analytics */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Google Analytics</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300">Analītika iespējota</h5>
                          <p className="text-xs text-gray-500">Google Analytics izsekošana</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.integrations.analyticsEnabled}
                            onChange={(e) => updateSettings('integrations', 'analyticsEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {settings.integrations.analyticsEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Google Analytics ID
                          </label>
                          <input
                            type="text"
                            value={settings.integrations.googleAnalyticsId}
                            onChange={(e) => updateSettings('integrations', 'googleAnalyticsId', e.target.value)}
                            placeholder="GA_MEASUREMENT_ID"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other Integrations */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Citas integrācijas</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300">Google Fit</h5>
                          <p className="text-xs text-gray-500">Google Fit datu sinhronizācija</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.integrations.googleFitEnabled}
                            onChange={(e) => updateSettings('integrations', 'googleFitEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-300">Garmin Connect</h5>
                          <p className="text-xs text-gray-500">Garmin ierīču datu integrācija</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.integrations.garminEnabled}
                            onChange={(e) => updateSettings('integrations', 'garminEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminSettingsPage);