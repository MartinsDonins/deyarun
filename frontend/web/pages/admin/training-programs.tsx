import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth, withAdminAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import { getAuthToken } from '../../utils/auth'
import { logger } from '../../lib/productionLogger'

interface TrainingProgramTemplate {
  id: string
  name: string
  description: string
  targetDistance: '5K' | '10K' | 'half-marathon' | 'marathon' | 'other'
  duration: number // weeks
  sessionsPerWeek: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  phases: {
    name: string
    weeks: number
    focus: string
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TrainingProgramForm {
  name: string
  description: string
  targetDistance: '5K' | '10K' | 'half-marathon' | 'marathon' | 'other'
  duration: number
  sessionsPerWeek: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  phases: {
    name: string
    weeks: number
    focus: string
  }[]
}

function AdminTrainingPrograms() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [programs, setPrograms] = useState<TrainingProgramTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgramTemplate | null>(null)
  const [formData, setFormData] = useState<TrainingProgramForm>({
    name: '',
    description: '',
    targetDistance: '5K',
    duration: 12,
    sessionsPerWeek: 3,
    difficultyLevel: 'beginner',
    phases: [
      { name: 'Pamatu veidošana', weeks: 4, focus: 'Aerobā izturība' },
      { name: 'Intensitātes attīstība', weeks: 4, focus: 'Ātruma darbs' },
      { name: 'Specializācija', weeks: 3, focus: 'Sacensību distance' },
      { name: 'Atjaunošanās', weeks: 1, focus: 'Atpūta' }
    ]
  })

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadPrograms()
    }
  }, [isAdmin])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/training-programs`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      } else {
        // Fallback to empty array on error
        setPrograms([])
        logger.error('ERROR', 'Failed to load training programs:', { error: response.statusText })
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading programs:', { error: error })
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phases total weeks
    const totalPhaseWeeks = formData.phases.reduce((sum, phase) => sum + phase.weeks, 0)
    if (totalPhaseWeeks !== formData.duration) {
      alert(`Error: Fāžu kopējais nedēļu skaits (${totalPhaseWeeks}) neatbilst programmas ilgumam (${formData.duration} nedēļas). Lūdzu pielāgojiet fāzes vai programmas ilgumu.`)
      return
    }
    
    // Validate all phases have required fields
    for (let i = 0; i < formData.phases.length; i++) {
      const phase = formData.phases[i]
      if (!phase.name.trim() || !phase.focus.trim() || phase.weeks < 1) {
        alert(`Error fāzē ${i + 1}: Visi lauki (nosaukums, fokuss) ir obligāti un nedēļu skaitam jābūt vismaz 1.`)
        return
      }
    }
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      logger.info('COMPONENT', 'Sending training program data:', { formData })
      
      const response = await fetch(`${API_BASE_URL}/api/admin/training-programs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Program created successfully:', { data })
        // Reload programs to get the latest data
        await loadPrograms()
        setShowCreateModal(false)
        resetForm()
        alert('Programma veiksmīgi izveidota!')
      } else {
        const errorData = await response.json()
        logger.error('ERROR', 'Failed to create program:', { error: errorData })
        alert(`Error veidojot programmu: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      logger.error('ERROR', 'Error creating program:', { error: error })
      alert('Error veidojot programmu. Pārbaudiet interneta savienojumu un mēģiniet vēlreiz.')
    }
  }

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProgram) return
    
    // Validate phases total weeks
    const totalPhaseWeeks = formData.phases.reduce((sum, phase) => sum + phase.weeks, 0)
    if (totalPhaseWeeks !== formData.duration) {
      alert(`Error: Fāžu kopējais nedēļu skaits (${totalPhaseWeeks}) neatbilst programmas ilgumam (${formData.duration} nedēļas). Lūdzu pielāgojiet fāzes vai programmas ilgumu.`)
      return
    }
    
    // Validate all phases have required fields
    for (let i = 0; i < formData.phases.length; i++) {
      const phase = formData.phases[i]
      if (!phase.name.trim() || !phase.focus.trim() || phase.weeks < 1) {
        alert(`Error fāzē ${i + 1}: Visi lauki (nosaukums, fokuss) ir obligāti un nedēļu skaitam jābūt vismaz 1.`)
        return
      }
    }
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      logger.info('COMPONENT', 'Updating training program data:', { formData })
      
      const response = await fetch(`${API_BASE_URL}/api/admin/training-programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Program updated successfully:', { data })
        // Reload programs to get the latest data
        await loadPrograms()
        setEditingProgram(null)
        setShowCreateModal(false)
        resetForm()
        alert('Programma veiksmīgi atjaunināta!')
      } else {
        const errorData = await response.json()
        logger.error('ERROR', 'Failed to update program:', { error: errorData })
        alert(`Error atjauninot programmu: ${errorData.message || errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      logger.error('ERROR', 'Error updating program:', { error: error })
      alert('Error atjauninot programmu. Pārbaudiet interneta savienojumu un mēģiniet vēlreiz.')
    }
  }

  const toggleProgramStatus = async (id: string) => {
    try {
      const program = programs.find(p => p.id === id)
      if (!program) return

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/training-programs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !program.isActive })
      })

      if (response.ok) {
        // Reload programs to get the latest data
        await loadPrograms()
      } else {
        const errorData = await response.json()
        logger.error('ERROR', 'Failed to toggle program status:', { error: errorData.message })
        alert(`Error mainot programmas statusu: ${errorData.message}`)
      }
    } catch (error) {
      logger.error('ERROR', 'Error toggling program status:', { error: error })
      alert('Error mainot programmas statusu')
    }
  }

  const deleteProgram = async (id: string) => {
    if (!confirm('Vai tiešām vēlaties dzēst šo treniņprogrammu?')) return
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/training-programs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Reload programs to get the latest data
        await loadPrograms()
      } else {
        const errorData = await response.json()
        logger.error('ERROR', 'Failed to delete program:', { error: errorData.message })
        alert(`Error dzēšot programmu: ${errorData.message}`)
      }
    } catch (error) {
      logger.error('ERROR', 'Error deleting program:', { error: error })
      alert('Error dzēšot programmu')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetDistance: '5K',
      duration: 12,
      sessionsPerWeek: 3,
      difficultyLevel: 'beginner',
      phases: [
        { name: 'Pamatu veidošana', weeks: 4, focus: 'Aerobā izturība' },
        { name: 'Intensitātes attīstība', weeks: 4, focus: 'Ātruma darbs' },
        { name: 'Specializācija', weeks: 3, focus: 'Sacensību distance' },
        { name: 'Atjaunošanās', weeks: 1, focus: 'Atpūta' }
      ]
    })
  }

  const startEdit = (program: TrainingProgramTemplate) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      description: program.description,
      targetDistance: program.targetDistance,
      duration: program.duration,
      sessionsPerWeek: program.sessionsPerWeek,
      difficultyLevel: program.difficultyLevel,
      phases: [...program.phases]
    })
    setShowCreateModal(true)
  }

  const addPhase = () => {
    setFormData({
      ...formData,
      phases: [...formData.phases, { name: '', weeks: 1, focus: '' }]
    })
  }

  const removePhase = (index: number) => {
    setFormData({
      ...formData,
      phases: formData.phases.filter((_, i) => i !== index)
    })
  }

  const updatePhase = (index: number, field: string, value: string | number) => {
    const updatedPhases = [...formData.phases]
    updatedPhases[index] = { ...updatedPhases[index], [field]: value }
    setFormData({ ...formData, phases: updatedPhases })
  }

  if (!user || !isAdmin) {
    return (
      <AdminLayout title="Treniņprogrammu pārvaldība">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">Nav piekļuves tiesību</div>
          <p className="text-gray-400">Jums nav administratora tiesību šīs lapas skatīšanai.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Treniņprogrammu pārvaldība">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Treniņprogrammu šabloni</h1>
              <p className="text-gray-400">Pārvaldiet treniņprogrammu šablonus AI ģenerācijai</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setEditingProgram(null)
                setShowCreateModal(true)
              }}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Izveidot programmu
            </button>
          </div>
        </div>

        {/* Programs List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Ielādē programmas...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nav izveidotas treniņprogrammas
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div key={program.id} className="bg-surface border border-gray-700 rounded-xl p-6 hover:border-coral transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{program.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{program.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-coral/20 text-coral text-xs rounded">
                          {program.targetDistance}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {program.duration} nedēļas
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                          {program.sessionsPerWeek}×/nedēļā
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                          {program.difficultyLevel}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Fāzes:</h4>
                        <div className="space-y-1">
                          {program.phases.map((phase, index) => (
                            <div key={index} className="text-xs text-gray-400">
                              <span className="font-medium">{phase.name}</span> ({phase.weeks} ned.) - {phase.focus}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleProgramStatus(program.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        program.isActive 
                          ? 'bg-green-900/30 text-green-300 border border-green-700'
                          : 'bg-red-900/30 text-red-300 border border-red-700'
                      }`}
                    >
                      {program.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(program.createdAt).toLocaleDateString('en-US')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(program)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteProgram(program.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                {editingProgram ? 'Edit programmu' : 'Izveidot jaunu programmu'}
              </h3>
              
              <form onSubmit={editingProgram ? handleUpdateProgram : handleCreateProgram} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nosaukums</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mērķa distance</label>
                    <select
                      value={formData.targetDistance}
                      onChange={(e) => setFormData({ ...formData, targetDistance: e.target.value as any })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    >
                      <option value="5K">5K</option>
                      <option value="10K">10K</option>
                      <option value="half-marathon">Pusmaratons</option>
                      <option value="marathon">Maratons</option>
                      <option value="other">Cita</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Apraksts</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ilgums (nedēļas)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      min="1"
                      max="52"
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Treniņi nedēļā</label>
                    <input
                      type="number"
                      value={formData.sessionsPerWeek}
                      onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) })}
                      min="1"
                      max="7"
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Grūtības līmenis</label>
                    <select
                      value={formData.difficultyLevel}
                      onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value as any })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    >
                      <option value="beginner">Iesācējs</option>
                      <option value="intermediate">Vidējais</option>
                      <option value="advanced">Uzlabotais</option>
                    </select>
                  </div>
                </div>

                {/* Training Phases */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Treniņu fāzes</label>
                      <div className="text-xs text-gray-400 mt-1">
                        Kopā: {formData.phases.reduce((sum, phase) => sum + phase.weeks, 0)} nedēļas 
                        {formData.phases.reduce((sum, phase) => sum + phase.weeks, 0) !== formData.duration && (
                          <span className="text-red-400 ml-2">
                            (nesakrīt ar programmas ilgumu: {formData.duration} nedēļas)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addPhase}
                      className="text-coral hover:text-white transition-colors text-sm"
                    >
                      + Pievienot fāzi
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.phases.map((phase, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-bg rounded-lg">
                        <input
                          type="text"
                          placeholder="Fāzes nosaukums"
                          value={phase.name}
                          onChange={(e) => updatePhase(index, 'name', e.target.value)}
                          className="px-3 py-2 bg-surface border border-gray-700 rounded text-white text-sm focus:border-coral focus:outline-none"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Nedēļas"
                          value={phase.weeks}
                          onChange={(e) => updatePhase(index, 'weeks', parseInt(e.target.value) || 1)}
                          min="1"
                          className="px-3 py-2 bg-surface border border-gray-700 rounded text-white text-sm focus:border-coral focus:outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Fokuss"
                          value={phase.focus}
                          onChange={(e) => updatePhase(index, 'focus', e.target.value)}
                          className="px-3 py-2 bg-surface border border-gray-700 rounded text-white text-sm focus:border-coral focus:outline-none"
                          required
                        />
                        {formData.phases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhase(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingProgram(null)
                      resetForm()
                    }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingProgram ? 'Save izmaiņas' : 'Izveidot programmu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default withAdminAuth(AdminTrainingPrograms)