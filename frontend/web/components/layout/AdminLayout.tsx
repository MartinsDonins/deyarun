import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from '../AdminSidebar'
import AdminTopBar from '../AdminTopBar'
import { logger } from '../../lib/productionLogger'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Debug logging - temporary
  if (!isAuthenticated || !isAdmin) {
    logger.info('COMPONENT', 'AdminLayout Access Check:', {
      isAuthenticated,
      isLoading,
      isAdmin,
      userRole: user?.role
    })
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      // Redirect non-admin users to regular dashboard
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Ielādē admin vidi...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Warning Banner */}
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium z-50 shadow-lg">
        🔒 ADMIN VIDE - Administratora pārvaldības panelis
      </div>
      
      <div className="flex pt-10">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <AdminTopBar 
            title={title} 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}