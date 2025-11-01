import Link from 'next/link'
import { PlayIcon, ShieldCheckIcon, GlobeAltIcon, BugAntIcon } from '@heroicons/react/24/outline'
import packageJson from '../package.json'
import ThemeToggle from './ThemeToggle'
import CopyButton from './ui/CopyButton'
import { useState } from 'react'

const currentYear = new Date().getFullYear()
const appVersion = packageJson.version

const footerLinks = {
  product: [
    { name: 'Sākums', href: '/' },
    { name: 'Funkcijas', href: '/#features' },
    { name: 'Cenas', href: '/pricing' },
    { name: 'Atsauksmes', href: '/#testimonials' }
  ],
  support: [
    { name: 'Palīdzības centrs', href: '/help' },
    { name: 'Kontakti', href: '/contact' },
    { name: 'FAQ', href: '/faq' }
  ],
  legal: [
    { name: 'Lietošanas noteikumi', href: '/terms' },
    { name: 'Privātuma politika', href: '/privacy' },
    { name: 'Sīkdatņu politika', href: '/cookies' },
    { name: 'GDPR', href: '/gdpr' }
  ],
  company: [
    { name: 'Par mums', href: '/about' },
    { name: 'Karjera', href: '/careers' },
    { name: 'Ziņas', href: '/news' },
    { name: 'Partneri', href: '/partners' }
  ]
}

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/runacademy',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/runacademy',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.329-1.297L6.826 14.4c.555.555 1.329.888 2.219.888 1.773 0 3.219-1.446 3.219-3.219s-1.446-3.219-3.219-3.219-3.219 1.446-3.219 3.219c0 .89.333 1.664.888 2.219l-1.291 1.706c-.807-.881-1.297-2.032-1.297-3.329 0-2.697 2.191-4.888 4.888-4.888s4.888 2.191 4.888 4.888-2.191 4.888-4.888 4.888zm7.409-9.529h-1.664V6.295h1.664v1.164zm1.11-2.773H15.8V3.522h1.168v1.164z"/>
      </svg>
    )
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/runacademy',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    )
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/runacademy',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  }
]

function DebugInfo() {
  const [showDebug, setShowDebug] = useState(false);
  
  const getDebugInfo = () => {
    return {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      version: packageJson.version,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com',
      theme: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      localStorage: typeof window !== 'undefined' ? {
        hasToken: !!localStorage.getItem('token'),
        hasTheme: !!localStorage.getItem('runacademy-theme'),
      } : null
    };
  };

  const debugText = JSON.stringify(getDebugInfo(), null, 2);

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
      >
        <BugAntIcon className="w-4 h-4" />
        <span>Debug info</span>
      </button>
      
      {showDebug && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-green-400 p-4 rounded-lg shadow-lg max-w-md z-50 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Debug informācija</span>
            <div className="flex space-x-2">
              <CopyButton text={debugText} size="sm" label="Kopēt" />
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg"
              >
                ×
              </button>
            </div>
          </div>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-green-400 p-2 rounded overflow-auto max-h-64">
            {debugText}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-coral/10 dark:bg-gray-800 border border-coral rounded-lg flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-coral" />
              </div>
              <span className="text-xl font-bold gradient-text">DeyaRun</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Tavs uzticamais ceļabiedrs skriešanas pasaulē. Attīsti savu prasmi, 
              sasniedz mērķus un pievienojies aktīvai skrējēju kopienai.
            </p>
            
            {/* Status Badge */}
            <div className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-400">Sistēma aktīva</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Produkts</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Atbalsts</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Juridiskā informācija</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* EU Compliance Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid md:grid-cols-2 gap-8">
            {/* EU Compliance Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GlobeAltIcon className="w-5 h-5 text-coral" />
                <h4 className="text-gray-900 dark:text-white font-semibold">ES atbilstība</h4>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                DeyaRun atbilst Eiropas Savienības datu aizsardzības prasībām (GDPR) 
                un nodrošina pilnīgu lietotāju datu drošību.
              </p>
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-xs font-medium">GDPR atbilstošs</span>
              </div>
            </div>

            {/* Company Info */}
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Organizācijas informācija</h4>
              <div className="text-gray-400 text-sm space-y-1">
                <p>deyarun.com</p>
                <p>Tiesiskā forma: Biedrība (BDR)</p>
                <p>Reģ. Nr.: 40008260404</p>
                <p>Adrese: Prūšu iela 4-273, Rīga, LV-1057</p>
                <p>E-pasts: info@runacademy.lv</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Consent Notice */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="text-blue-400 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h5 className="text-gray-900 dark:text-white font-medium text-sm mb-1">Sīkdatņu izmantošana</h5>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Mēs izmantojam sīkdatnes, lai uzlabotu jūsu pieredzi mūsu vietnē. 
                  Turpinot lietot vietni, jūs piekrītat mūsu {' '}
                  <Link href="/cookies" className="text-coral hover:underline">
                    sīkdatņu politikai
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Section */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <DebugInfo />
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © {currentYear} deyarun.com. Visas tiesības aizsargātas.
              <span className="ml-4 text-gray-500 dark:text-gray-500">v{appVersion}</span>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <ThemeToggle size="sm" />
              <Link 
                href="/terms"
                className="text-gray-400 hover:text-white dark:hover:text-white hover:text-gray-900 text-sm transition-colors"
              >
                Noteikumi
              </Link>
              <Link 
                href="/privacy"
                className="text-gray-400 hover:text-white dark:hover:text-white hover:text-gray-900 text-sm transition-colors"
              >
                Privātums
              </Link>
              <Link 
                href="/cookies"
                className="text-gray-400 hover:text-white dark:hover:text-white hover:text-gray-900 text-sm transition-colors"
              >
                Sīkdatnes
              </Link>
              <Link 
                href="/gdpr"
                className="text-gray-400 hover:text-white dark:hover:text-white hover:text-gray-900 text-sm transition-colors"
              >
                GDPR
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}