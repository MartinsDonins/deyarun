import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { analytics } from '../lib/analytics'
import { logger } from '../lib/productionLogger'

interface Course {
  id: string
  name: string
  description: string
  shortDescription?: string
  category: string
  level: string
  duration: string
  price: number
  currency: string
  isPaid: boolean
  features: string[]
  imageUrl?: string
  rating: number
  enrolledCount: number
  instructorName?: string
}

interface CourseEnrollment {
  courseId: string
  status: string
  progress: number
  enrolledAt: string
}

function Courses() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [userCourses, setUserCourses] = useState<CourseEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollLoading, setEnrollLoading] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [showPaidOnly, setShowPaidOnly] = useState(false)

  useEffect(() => {
    fetchCourses()
    fetchUserCourses()
    analytics.pageView('courses')
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/courses`)
      const data = await response.json()
      
      if (data.success) {
        // Backend returns data.courses, not just courses
        setCourses(data.data?.courses || [])
      } else {
        logger.error('ERROR', 'API returned error:', { error: data.error })
        setCourses([])
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching courses:', { error: error })
      setCourses([])
    }
  }

  const fetchUserCourses = async () => {
    if (!token) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/courses/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.courses) {
        setUserCourses(data.courses.map((c: any) => ({
          courseId: c.id,
          status: c.enrollmentStatus,
          progress: c.progress,
          enrolledAt: c.enrolledAt
        })))
      } else {
        logger.error('ERROR', 'API returned error:', { error: data.error })
        setUserCourses([])
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching user courses:', { error: error })
      setUserCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string, courseName: string, isPaid: boolean) => {
    if (!token) {
      router.push('/auth/login')
      return
    }

    setEnrollLoading(courseId)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        analytics.courseEnroll(isPaid ? 'paid' : 'free', courseName)
        await fetchUserCourses() // Refresh user courses
        alert('Veiksmīgi pieteicāties kursā!')
      } else if (data.upgradeRequired) {
        if (confirm(`Šis ir maksas kurss. Vai vēlaties uzlabot uz Premium abonementu par €${data.course.price}?`)) {
          router.push('/subscription')
        }
      } else {
        alert(data.message || 'Neizdevās pieteikties kursā')
      }
    } catch (error) {
      logger.error('ERROR', 'Enrollment error:', { error: error })
      alert('Radās kļūda. Lūdzu mēģiniet vēlreiz.')
    } finally {
      setEnrollLoading(null)
    }
  }

  const isEnrolled = (courseId: string) => {
    return userCourses.some(uc => uc.courseId === courseId)
  }

  const getUserCourseProgress = (courseId: string) => {
    const userCourse = userCourses.find(uc => uc.courseId === courseId)
    return userCourse?.progress || 0
  }

  const filteredCourses = courses.filter(course => {
    if (selectedCategory !== 'all' && course.category !== selectedCategory) return false
    if (selectedLevel !== 'all' && course.level !== selectedLevel) return false
    if (showPaidOnly && !course.isPaid) return false
    return true
  })

  const categories = Array.from(new Set(courses.map(c => c.category)))
  const levels = Array.from(new Set(courses.map(c => c.level)))

  if (loading) {
    return (
      <ProtectedLayout title="Kursi">
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Kursi">
      <div className="min-h-screen bg-adaptive">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-4 rounded-xl bg-[var(--deyarun-primary)]20">
              <svg className="w-8 h-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-adaptive-white mb-4">
              Trenēšanās kursi
            </h1>
            <p className="text-lg text-adaptive-light max-w-2xl mx-auto">
              Izvēlieties sev piemērotu kursu un sāciet trenēties ar profesionāļiem
            </p>
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-muted">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[var(--deyarun-success)] rounded-full mr-2"></div>
                {courses.filter(c => !c.isPaid).length} bezmaksas kursi
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[var(--deyarun-primary)] rounded-full mr-2"></div>
                {courses.filter(c => c.isPaid).length} premium kursi
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[var(--deyarun-warning)] rounded-full mr-2"></div>
                {userCourses.length} mani kursi
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-adaptive-white mb-4">Filtri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-adaptive-light">Kategorija</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-surface/50 border border-surface-light rounded-xl px-3 py-2 text-adaptive-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] transition-all"
                  >
                    <option value="all">Visas kategorijas</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-adaptive-light">Līmenis</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-surface/50 border border-surface-light rounded-xl px-3 py-2 text-adaptive-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] transition-all"
                  >
                    <option value="all">Visi līmeņi</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-adaptive-light">Cena</label>
                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="paidOnly"
                      checked={showPaidOnly}
                      onChange={(e) => setShowPaidOnly(e.target.checked)}
                      className="w-4 h-4 text-[var(--deyarun-primary)] bg-surface border-surface-light rounded focus:ring-[var(--deyarun-primary)] focus:ring-2"
                    />
                    <label htmlFor="paidOnly" className="text-adaptive-light">Tikai maksas kursi</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-adaptive-light">Jūsu abonements</label>
                  <div className={`inline-flex px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    user?.subscriptionType === 'premium' || user?.subscriptionType === 'pro'
                      ? 'bg-[var(--deyarun-primary)]20 text-[var(--deyarun-primary)] border border-[var(--deyarun-primary)]30'
                      : 'bg-surface/50 text-adaptive-light border border-surface-light'
                  }`}>
                    {user?.subscriptionType === 'free' ? 'Bezmaksas' :
                     user?.subscriptionType === 'premium' ? 'Premium' : 'Pro'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const enrolled = isEnrolled(course.id)
              const progress = getUserCourseProgress(course.id)
              
              return (
                <div 
                  key={course.id}
                  className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--deyarun-primary)]20 to-[var(--deyarun-secondary)]30 flex items-center justify-center">
                        <svg className="w-16 h-16 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Course badges */}
                    <div className="absolute top-4 left-4 flex space-x-2">
                      {course.isPaid ? (
                        <span className="bg-[var(--deyarun-primary)] text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                          €{course.price}
                        </span>
                      ) : (
                        <span className="bg-[var(--deyarun-success)] text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                          Bezmaksas
                        </span>
                      )}
                      <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        {course.level}
                      </span>
                    </div>

                    {enrolled && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-[var(--deyarun-success)] text-white p-2 rounded-full shadow-lg">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Rating overlay */}
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center space-x-1">
                        <svg className="w-4 h-4 text-[var(--deyarun-warning)]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm">{course.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    {/* Category and Duration */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[var(--deyarun-primary)] text-sm font-medium bg-[var(--deyarun-primary)]10 px-2 py-1 rounded-lg">
                        {course.category}
                      </span>
                      <span className="text-muted text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-adaptive-white mb-3 group-hover:text-[var(--deyarun-primary)] transition-colors line-clamp-2">
                      {course.name}
                    </h3>
                    
                    <p className="text-adaptive-light mb-4 line-clamp-3 text-sm leading-relaxed">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-muted">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {course.enrolledCount} dalībnieki
                      </div>
                      {course.instructorName && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {course.instructorName}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar for Enrolled Courses */}
                    {enrolled && progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-adaptive-light">Progress</span>
                          <span className="text-[var(--deyarun-primary)] font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-surface/30 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {enrolled ? (
                        <button
                          onClick={() => router.push(`/courses/${course.id}`)}
                          className="w-full bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                        >
                          Turpināt kursu
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id, course.name, course.isPaid)}
                          disabled={enrollLoading === course.id}
                          className="w-full bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {enrollLoading === course.id ? (
                            <div className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Pieteicos...
                            </div>
                          ) : course.isPaid ? (
                            `Pieteikties - €${course.price}`
                          ) : (
                            'Pieteikties bezmaksas'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-xl bg-[var(--deyarun-primary)]20">
                  <svg className="w-8 h-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-adaptive-white mb-2">Nav atrasti kursi</h3>
                <p className="text-adaptive-light mb-4">Nav atrasti kursi ar norādītajiem filtriem</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedLevel('all')
                    setShowPaidOnly(false)
                  }}
                  className="bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] text-white py-2 px-4 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Notīrīt filtrus
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(Courses)