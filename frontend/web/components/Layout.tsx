import { ReactNode, useState } from 'react'
import NavigationBar from './NavigationBar'

interface LayoutProps {
  title?: string
  children: ReactNode
  showNavigation?: boolean
  className?: string
}

export default function Layout({ title, children, showNavigation = true, className = '' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg text-white">
      {showNavigation && <NavigationBar />}
      <main className={`px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto ${className}`}>
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            <div className="w-20 h-1 gradient-coral rounded-full"></div>
          </div>
        )}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
