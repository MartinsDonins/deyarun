import ProtectedLayout from '../components/layout/ProtectedLayout'
import { withAuth } from '../contexts/AuthContext'

function CoachTipsPage() {
  return (
    <ProtectedLayout title="Trenera padomi">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Trenera padomi</h1>
          <p className="text-gray-400">Profesionāli skrējiena padomi jūsu snieguma uzlabošanai</p>
        </div>

        {/* Coming Soon Card */}
        <div className="card text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Drīzumā!</h3>
            <p className="text-gray-400 mb-6">
              Mēs strādājam pie unikālu trenera padomu izstrādes, kas palīdzēs jums uzlabot skrējiena tehniku un sasniegt labākus rezultātus.
            </p>
            <div className="bg-surface rounded-lg p-4">
              <h4 className="text-lg font-medium text-white mb-2">Ko jūs varēsiet gaidīt:</h4>
              <ul className="text-sm text-gray-400 space-y-1 text-left">
                <li>• Personalizētus treniņu ieteikumus</li>
                <li>• Tehniskos padomus skrējiena uzlabošanai</li>
                <li>• Uztura un atveseļošanās vadlīnijas</li>
                <li>• Sezonu specifiskus padomus</li>
                <li>• Traumu profilakses ieteikumus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(CoachTipsPage)
