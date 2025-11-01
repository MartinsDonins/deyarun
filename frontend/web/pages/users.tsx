import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useUsers } from '../hooks/useApi'
import { useState, useMemo } from 'react'
import { withAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { logger } from '../lib/productionLogger'

interface UserFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  sortBy: 'name' | 'email' | 'created' | 'lastActive'
  sortOrder: 'asc' | 'desc'
}

function Users() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    sortBy: 'lastActive',
    sortOrder: 'desc'
  })

  const { data: allUsers, loading, error, refetch } = useUsers(100, 0)

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!allUsers) return []

    let filtered = allUsers.filter(user => {
      // Search filter
      const searchMatch = filters.search === '' || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())

      // Status filter
      const isActive = user.lastActiveAt && 
        new Date(user.lastActiveAt) > new Date(Date.now() - 24*60*60*1000)
      const statusMatch = filters.status === 'all' ||
        (filters.status === 'active' && isActive) ||
        (filters.status === 'inactive' && !isActive)

      return searchMatch && statusMatch
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'lastActive':
          aValue = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
          bValue = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allUsers, filters])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleResendVerification = async (userId: string, userName: string, isFirstTime: boolean = false) => {
    const message = isFirstTime 
      ? `Nosūtīt e-pasta apstiprināšanas e-pastu lietotājam ${userName}?`
      : `Nosūtīt atkārtoti e-pasta apstiprināšanas e-pastu lietotājam ${userName}?`
    
    if (!window.confirm(message)) {
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/resend-verification`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.data.success) {
        alert('E-pasta apstiprināšanas e-pasts nosūtīts veiksmīgi!')
        // Refresh the users list
        refetch()
      } else {
        alert('Error: ' + response.data.message)
      }
    } catch (error: any) {
      logger.error('ERROR', 'Error resending verification email:', { error: error })
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      alert('Error nosūtot e-pastu: ' + errorMessage)
    }
  }

  const isUserActive = (user: any) => {
    return user.lastActiveAt && 
      new Date(user.lastActiveAt) > new Date(Date.now() - 24*60*60*1000)
  }

  const needsEmailVerification = (user: any) => {
    return !user.isEmailVerified
  }

  const isFirstTimeVerification = (user: any) => {
    return !user.isEmailVerified && !user.emailVerificationSentAt
  }

  return (
    <ProtectedLayout title="Lietotāju pārvaldība">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Kopējie lietotāji</p>
                <p className="text-2xl font-bold text-white">{allUsers?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Aktīvie šodien</p>
                <p className="text-2xl font-bold text-white">
                  {allUsers?.filter(u => isUserActive(u)).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Jaunie šomēnes</p>
                <p className="text-2xl font-bold text-white">
                  {allUsers?.filter(u => 
                    new Date(u.createdAt) > new Date(Date.now() - 30*24*60*60*1000)
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Filtrētie</p>
                <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Meklēt lietotājus..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-surface border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-coral focus:outline-none transition-colors"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-3 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none transition-colors"
              >
                <option value="all">Visi lietotāji</option>
                <option value="active">Aktīvie</option>
                <option value="inactive">Neaktīvie</option>
              </select>

              {/* Sort Options */}
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-4 py-3 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none transition-colors"
                >
                  <option value="lastActive">Pēdējā aktivitāte</option>
                  <option value="name">Vārds</option>
                  <option value="email">E-pasts</option>
                  <option value="created">Reģistrācijas datums</option>
                </select>

                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                  title={filters.sortOrder === 'asc' ? 'Augoša secība' : 'Dilstoša secība'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* View Toggle and Actions */}
            <div className="flex items-center gap-3">
              <div className="flex bg-surface border border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md transition-colors text-sm ${
                    viewMode === 'cards' 
                      ? 'bg-coral text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md transition-colors text-sm ${
                    viewMode === 'table' 
                      ? 'bg-coral text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button 
                onClick={refetch}
                className="px-4 py-3 bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button className="btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Pievienot lietotāju
              </button>
            </div>
          </div>
        </div>

        {/* Users Content */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Lietotāju saraksts ({currentUsers.length} no {filteredUsers.length})
            </h2>
            <div className="text-sm text-gray-400">
              Lapa {currentPage} no {totalPages}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Ielādē lietotājus...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-400 mb-2">Error ielādējot datus</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-500/10 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">Nav atrasti lietotāji</p>
              <p className="text-gray-500 text-sm">Izmēģiniet mainīt meklēšanas vai filtrēšanas nosacījumus</p>
            </div>
          ) : (
            <>
              {/* Card View */}
              {viewMode === 'cards' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentUsers.map((user) => {
                    const isActive = isUserActive(user)
                    
                    return (
                      <div key={user.id} className="bg-surface border border-gray-700 rounded-xl p-6 hover:border-coral/50 transition-all duration-200 hover:shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full gradient-coral flex items-center justify-center text-white font-semibold text-lg">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-semibold">{user.firstName} {user.lastName}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                            {isActive ? 'Aktīvs' : 'Neaktīvs'}
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Reģistrējies:</span>
                            <span className="text-gray-300">{new Date(user.createdAt).toLocaleDateString('en-US')}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Pēdējā aktivitāte:</span>
                            <span className="text-gray-300">
                              {user.lastActiveAt 
                                ? new Date(user.lastActiveAt).toLocaleDateString('en-US')
                                : 'Nav datu'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">ID:</span>
                            <span className="text-gray-400 font-mono">{user.id}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">E-pasts:</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.isEmailVerified 
                                ? 'bg-green-500/20 text-green-400' 
                                : isFirstTimeVerification(user)
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {user.isEmailVerified 
                                ? 'Apstiprināts' 
                                : isFirstTimeVerification(user)
                                  ? 'Nav nosūtīts'
                                  : 'Nav apstiprināts'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                          <button className="flex-1 px-3 py-2 bg-coral/10 text-coral rounded-lg text-sm font-medium hover:bg-coral/20 transition-colors">
                            Skatīt
                          </button>
                          {needsEmailVerification(user) && (
                            <button 
                              onClick={() => handleResendVerification(user.id, `${user.firstName} ${user.lastName}`, isFirstTimeVerification(user))}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isFirstTimeVerification(user)
                                  ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                  : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              }`}
                              title={
                                isFirstTimeVerification(user)
                                  ? "Nosūtīt e-pasta apstiprināšanas e-pastu"
                                  : "Nosūtīt atkārtoti e-pasta apstiprināšanas e-pastu"
                              }
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isFirstTimeVerification(user) ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.828 0L21.89 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                )}
                              </svg>
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:text-coral transition-colors rounded-lg hover:bg-coral/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Lietotājs</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">E-pasts</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">E-pasta statuss</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Reģistrēts</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Pēdējā aktivitāte</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Statuss</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Darbības</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((user) => {
                        const isActive = isUserActive(user)
                        
                        return (
                          <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center text-white font-semibold">
                                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                                  <p className="text-gray-400 text-sm">ID: {user.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-300">{user.email}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                user.isEmailVerified 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : isFirstTimeVerification(user)
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  user.isEmailVerified 
                                    ? 'bg-green-400' 
                                    : isFirstTimeVerification(user)
                                      ? 'bg-red-400'
                                      : 'bg-yellow-400'
                                }`}></div>
                                {user.isEmailVerified 
                                  ? 'Apstiprināts' 
                                  : isFirstTimeVerification(user)
                                    ? 'Nav nosūtīts'
                                    : 'Nav apstiprināts'
                                }
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              {new Date(user.createdAt).toLocaleDateString('en-US')}
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              {user.lastActiveAt 
                                ? new Date(user.lastActiveAt).toLocaleDateString('en-US')
                                : 'Nav datu'
                              }
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isActive 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : 'bg-gray-500/10 text-gray-400'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-green-400' : 'bg-gray-400'
                                }`}></div>
                                {isActive ? 'Aktīvs' : 'Neaktīvs'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {needsEmailVerification(user) && (
                                  <button 
                                    onClick={() => handleResendVerification(user.id, `${user.firstName} ${user.lastName}`, isFirstTimeVerification(user))}
                                    className={`p-2 transition-colors rounded-lg ${
                                      isFirstTimeVerification(user)
                                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-400/10'
                                        : 'text-blue-400 hover:text-blue-300 hover:bg-blue-400/10'
                                    }`}
                                    title={
                                      isFirstTimeVerification(user)
                                        ? "Nosūtīt e-pasta apstiprināšanas e-pastu"
                                        : "Nosūtīt atkārtoti e-pasta apstiprināšanas e-pastu"
                                    }
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {isFirstTimeVerification(user) ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.828 0L21.89 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      )}
                                    </svg>
                                  </button>
                                )}
                                <button className="p-2 text-gray-400 hover:text-coral transition-colors rounded-lg hover:bg-coral/10" title="Rediģēt">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-400/10" title="Skatīt">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10" title="Dzēst">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {filteredUsers.length > itemsPerPage && (
          <div className="card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Rāda {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} no {filteredUsers.length} lietotājiem
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⟪
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⟨ Iepriekšējā
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-coral text-white'
                            : 'bg-surface border border-gray-700 text-white hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Nākamā ⟩
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⟫
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(Users)
