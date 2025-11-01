import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useUsers, UserData } from '../../hooks/useUsers'
import { useAuth, withAdminAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DatePicker from '../../components/DatePicker'
import UserDetailsModal from '../../components/admin/UserDetailsModal'
import { logger } from '../../lib/productionLogger'

interface UserFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'admin' | 'coach' | 'user'
  isActive: boolean
  birthDate: string
  gender: 'male' | 'female' | 'other'
}

function AdminUsers() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const [filters, setFilters] = useState({
    role: 'all' as 'all' | 'admin' | 'coach' | 'user',
    search: '',
    isActive: undefined as boolean | undefined,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    limit: 20,
    offset: 0
  })
  
  const { users, loading, error, total, refetch, updateUserRole, toggleUserStatus, deleteUser, createUser, updateUser, verifyUserEmail } = useUsers(filters)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<UserData | null>(null)
  const [showUserDetails, setShowUserDetails] = useState<{ isOpen: boolean; userId: string }>({ isOpen: false, userId: '' })
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<{ isOpen: boolean; user: UserData | null }>({ isOpen: false, user: null })
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
    birthDate: '',
    gender: 'other'
  })

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push('/dashboard')
    }
  }, [currentUser, isAdmin, router])

  if (!currentUser || !isAdmin) {
    return (
      <AdminLayout title="Lietotāju pārvaldība">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">Nav piekļuves tiesību</div>
          <p className="text-gray-400">Jums nav administratora tiesību šīs lapas skatīšanai.</p>
        </div>
      </AdminLayout>
    )
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser(formData)
      setShowCreateModal(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'user',
        isActive: true,
        birthDate: '',
        gender: 'other'
      })
      setNotification({ type: 'success', message: 'Lietotājs veiksmīgi izveidots!' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      logger.error('ERROR', 'Error creating user:', { error: error })
      setNotification({ 
        type: 'error', 
        message: error.message || 'Error izveidojot lietotāju. Lūdzu mēģiniet vēlreiz.' 
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleDeleteUser = async () => {
    if (!showDeleteModal) return
    
    try {
      await deleteUser(showDeleteModal.id)
      setShowDeleteModal(null)
      setNotification({ type: 'success', message: 'Lietotājs veiksmīgi dzēsts!' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      logger.error('ERROR', 'Error deleting user:', { error: error })
      setNotification({ 
        type: 'error', 
        message: error.message || 'Error dzēšot lietotāju. Lūdzu mēģiniet vēlreiz.' 
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    try {
      // Only send fields that have changed (exclude password if empty)
      const updateData: Partial<UserData & { password?: string }> = {}
      
      if (formData.firstName !== editingUser.firstName) {
        updateData.firstName = formData.firstName
      }
      if (formData.lastName !== editingUser.lastName) {
        updateData.lastName = formData.lastName
      }
      if (formData.email !== editingUser.email) {
        updateData.email = formData.email
      }
      if (formData.role !== editingUser.role) {
        updateData.role = formData.role
      }
      if (formData.isActive !== editingUser.isActive) {
        updateData.isActive = formData.isActive
      }
      if (formData.birthDate !== editingUser.birthDate) {
        updateData.birthDate = formData.birthDate
      }
      if (formData.gender !== editingUser.gender) {
        updateData.gender = formData.gender
      }
      // Only include password if it's provided
      if (formData.password && formData.password.length > 0) {
        updateData.password = formData.password
      }
      
      await updateUser(editingUser.id, updateData)
      setEditingUser(null)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'user',
        isActive: true,
        birthDate: '',
        gender: 'other'
      })
      setNotification({ type: 'success', message: 'Lietotājs veiksmīgi atjaunināts!' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      logger.error('ERROR', 'Error updating user:', { error: error })
      setNotification({ type: 'error', message: 'Error atjauninot lietotāju. Lūdzu mēģiniet vēlreiz.' })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      isActive: user.isActive,
      birthDate: user.birthDate || '',
      gender: user.gender || 'other'
    })
  }

  const openSubscriptionModal = async (user: UserData) => {
    setShowSubscriptionModal({ isOpen: true, user })
    // Load available subscription plans
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/subscription-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailablePlans(data.plans || [])
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading subscription plans:', { error: error })
      setAvailablePlans([])
    }
  }

  const assignSubscription = async (userId: string, planId: string, duration: number = 30) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/users/${userId}/assign-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          duration // days
        })
      })
      
      if (response.ok) {
        setNotification({ type: 'success', message: 'Abonaments veiksmīgi piešķirts!' })
        setShowSubscriptionModal({ isOpen: false, user: null })
        refetch() // Refresh user list
      } else {
        const error = await response.json()
        setNotification({ type: 'error', message: error.message || 'Error piešķirot abonamentu' })
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error assigning subscription:', { error: error })
      setNotification({ type: 'error', message: 'Error piešķirot abonamentu' })
    }
    setTimeout(() => setNotification(null), 5000)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900/30 text-red-300 border-red-700'
      case 'coach':
        return 'bg-blue-900/30 text-blue-300 border-blue-700'
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-700'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-900/30 text-green-300 border-green-700'
      : 'bg-red-900/30 text-red-300 border-red-700'
  }

  return (
    <AdminLayout title="Lietotāju pārvaldība">
      {/* Success/Error Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-900/20 border-green-500/20 text-green-400' 
            : 'bg-red-900/20 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Filters and Search */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Meklēt lietotājus..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, offset: 0 })}
                  className="w-full sm:w-64 px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-coral focus:outline-none"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value as any, offset: 0 })}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="all">Visas lomas</option>
                <option value="admin">Administratori</option>
                <option value="coach">Treneri</option>
                <option value="user">Lietotāji</option>
              </select>

              <select
                value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  isActive: e.target.value === 'all' ? undefined : e.target.value === 'true',
                  offset: 0 
                })}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="all">Visi statusi</option>
                <option value="true">Aktīvi</option>
                <option value="false">Neaktīvi</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Pievienot lietotāju
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Lietotāji ({total})
            </h2>
            <button
              onClick={refetch}
              className="text-coral hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Ielādē lietotājus...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Error ielādējot lietotājus: {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nav atrasti lietotāji
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Vārds</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">E-pasts</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">E-pasta verifikācija</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Loma</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Reģistrācija</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-coral flex items-center justify-center text-white text-sm font-semibold">
                            {user.firstName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                            {user.stats && (
                              <div className="text-xs text-gray-400">
                                {user.stats.totalWorkouts} treniņi
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{user.email}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isEmailVerified 
                              ? 'bg-green-900/20 text-green-400 border border-green-800' 
                              : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
                          }`}>
                            {user.isEmailVerified ? '✓ Apstiprināts' : '⚠ Nav apstiprināts'}
                          </span>
                          {!user.isEmailVerified && (
                            <button
                              onClick={async () => {
                                try {
                                  await verifyUserEmail(user.id)
                                  setNotification({ type: 'success', message: 'E-pasts apstiprināts!' })
                                  setTimeout(() => setNotification(null), 3000)
                                } catch (error: any) {
                                  setNotification({ type: 'error', message: error.message || 'Error apstiprinot e-pastu' })
                                  setTimeout(() => setNotification(null), 5000)
                                }
                              }}
                              className="px-1 py-1 bg-coral hover:bg-coral-600 text-white rounded text-xs transition-colors"
                              title="Apstiprināt e-pastu manuāli"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                          className={`px-2 py-1 rounded border text-xs font-medium ${getRoleBadgeColor(user.role)} bg-transparent transition-colors ${
                            user.id === currentUser?.id 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-surface cursor-pointer'
                          }`}
                          disabled={user.id === currentUser?.id} // Can't change own role
                          title={user.id === currentUser?.id ? 'Nav iespējams mainīt savu lomu' : 'Mainīt lietotāja lomu'}
                        >
                          <option value="user">Lietotājs</option>
                          <option value="coach">Treners</option>
                          <option value="admin">Administrators</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-2 py-1 rounded border text-xs font-medium ${getStatusBadgeColor(user.isActive)}`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowUserDetails({ isOpen: true, userId: user.id })}
                            className="text-coral hover:text-white transition-colors"
                            title="View detaļas"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit lietotāju"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openSubscriptionModal(user)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Pārvaldīt abonamentu"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(user)}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={user.id === currentUser?.id} // Can't delete self
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > filters.limit && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Rāda {filters.offset + 1}-{Math.min(filters.offset + filters.limit, total)} no {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
                disabled={filters.offset === 0}
                className="btn-ghost disabled:opacity-50"
              >
                Iepriekšējā
              </button>
              <button
                onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
                disabled={filters.offset + filters.limit >= total}
                className="btn-ghost disabled:opacity-50"
              >
                Nākamā
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Pievienot jaunu lietotāju</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vārds</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Uzvārds</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">E-pasts</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Parole</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dzimšanas datums</label>
                <DatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  placeholder="Izvēlieties dzimšanas datumu"
                  maxDate={new Date(new Date().getFullYear() - 13, 11, 31).toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dzimums</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                >
                  <option value="male">Vīrietis</option>
                  <option value="female">Sieviete</option>
                  <option value="other">Cits</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Loma</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                >
                  <option value="user">Lietotājs</option>
                  <option value="coach">Treners</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">Active lietotājs</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Izveidot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Edit lietotāju</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vārds</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Uzvārds</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">E-pasts</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Jauna parole (atstāt tukšu, ja nemaina)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  minLength={6}
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Atstājiet tukšu, ja nevēlaties mainīt paroli
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dzimšanas datums</label>
                <DatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  placeholder="Izvēlieties dzimšanas datumu"
                  maxDate={new Date(new Date().getFullYear() - 13, 11, 31).toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dzimums</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                >
                  <option value="male">Vīrietis</option>
                  <option value="female">Sieviete</option>
                  <option value="other">Cits</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Loma</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  disabled={editingUser.id === currentUser?.id} // Can't change own role
                >
                  <option value="user">Lietotājs</option>
                  <option value="coach">Treners</option>
                  <option value="admin">Administrators</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Nav iespējams mainīt savu lomu
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-300">Active lietotājs</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null)
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      role: 'user',
                      isActive: true,
                      birthDate: '',
                      gender: 'other'
                    })
                  }}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save izmaiņas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Delete lietotāju</h3>
            <p className="text-gray-300 mb-6">
              Vai tiešām vēlaties dzēst lietotāju <strong>{showDeleteModal.firstName} {showDeleteModal.lastName}</strong>? 
              Šī darbība ir neatgriezeniska.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Assignment Modal */}
      {showSubscriptionModal.isOpen && showSubscriptionModal.user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Piešķirt abonamentu: {showSubscriptionModal.user.firstName} {showSubscriptionModal.user.lastName}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Abonaments plāns</label>
                {availablePlans.length > 0 ? (
                  <div className="space-y-2">
                    {availablePlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{plan.name}</h4>
                            <p className="text-sm text-gray-400">{plan.description}</p>
                            <p className="text-sm text-coral font-medium">{plan.price}€/{plan.interval}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => assignSubscription(showSubscriptionModal.user!.id, plan.id, 30)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
                            >
                              30 dienas
                            </button>
                            <button
                              onClick={() => assignSubscription(showSubscriptionModal.user!.id, plan.id, 365)}
                              className="px-3 py-1 bg-coral hover:bg-orange-600 text-white text-sm rounded transition-colors"
                            >
                              1 gads
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    Nav pieejami abonamenta plāni
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal({ isOpen: false, user: null })}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserDetails.isOpen}
        onClose={() => setShowUserDetails({ isOpen: false, userId: '' })}
        userId={showUserDetails.userId}
      />
    </AdminLayout>
  )
}

export default withAdminAuth(AdminUsers)