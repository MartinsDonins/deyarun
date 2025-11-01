import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export default function StatCard({ title, value, icon, trend = 'neutral', trendValue }: StatCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  }

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
      </svg>
    ),
    neutral: null
  }

  return (
    <div className="card hover-lift group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-coral/10 text-coral flex items-center justify-center group-hover:bg-coral/20 transition-colors">
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400 mb-1">{title}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
            </div>
          </div>
          
          {trendValue && (
            <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
              {trendIcons[trend]}
              <span>{trendValue}</span>
              <span className="text-gray-500">vs pagājušajā periodā</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
