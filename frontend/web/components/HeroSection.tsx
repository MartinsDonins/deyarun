export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-surface to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-coral/5 to-transparent"></div>
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-coral/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-coral/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          {/* Main heading */}
          <div className="animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="block text-white">Tavs</span>
              <span className="block gradient-text">DeyaRun</span>
              <span className="block text-white">Ceļš</span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <div className="animate-slide-up delay-300">
            <p className="max-w-3xl mx-auto text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
              Pievienojies skrējēju kopienai un seko saviem treniņiem reālā laikā. 
              Attīsti sevi kopā ar profesionāliem treneriem un uzstādi jaunus rekordus.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="animate-slide-up delay-500 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/dashboard" className="btn-primary text-lg px-8 py-4">
              Sākt treniņu
              <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <button className="btn-ghost text-lg px-8 py-4">
              Uzzināt vairāk
              <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {/* Stats preview */}
          <div className="animate-slide-up delay-700 mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-coral mb-1">1000+</div>
              <div className="text-sm text-gray-400">Aktīvi skrējēji</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-coral mb-1">50K+</div>
              <div className="text-sm text-gray-400">Pabeigti treniņi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-coral mb-1">24/7</div>
              <div className="text-sm text-gray-400">Atbalsts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}