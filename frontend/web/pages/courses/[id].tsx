import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import ProtectedLayout from '../../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../../contexts/AuthContext'
import { analytics } from '../../lib/analytics'
import { logger } from '../../lib/productionLogger'

interface Course {
  id: string
  name: string
  title: string
  description: string
  shortDescription?: string
  category: string
  level: string
  difficulty: string
  duration: string
  price: number
  currency: string
  isPaid: boolean
  features: string[]
  imageUrl?: string
  rating: number
  enrolledCount: number
  instructorName?: string
  lessons?: Lesson[]
  totalLessons?: number
}

interface Lesson {
  _id: string
  title: string
  description: string
  type: string
  duration: number
  order: number
  isPublished: boolean
}

interface UserProgress {
  status: string
  completionPercentage: number
  completedLessons: number
  totalLessons: number
  lastAccessed: string
  lessonProgress?: {
    [lessonId: string]: {
      completed: boolean
      status: string
      lastAccessedAt: string
    }
  }
}

function CourseDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, token } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [generatingWorkout, setGeneratingWorkout] = useState(false)
  const [unenrolling, setUnenrolling] = useState(false)
  const [deletingProgress, setDeletingProgress] = useState(false)
  const [workoutGenerated, setWorkoutGenerated] = useState(false)
  const [generatedWorkoutId, setGeneratedWorkoutId] = useState<string | null>(null)
  const [cancelingWorkout, setCancelingWorkout] = useState(false)
  // Error handling removed temporarily for build
  const [canAccess, setCanAccess] = useState(false)
  const [showWorkoutDatePicker, setShowWorkoutDatePicker] = useState(false)
  const [workoutStartDate, setWorkoutStartDate] = useState('')
  
  // Helper function to get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  useEffect(() => {
    if (id) {
      fetchCourseDetails()
      analytics.pageView('course-detail')
    }
  }, [id, token])

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      logger.error('ERROR', null)
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/courses/${id}?includeProgress=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          logger.error('ERROR', 'Course not found')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Debug full response first
      logger.info('COMPONENT', 'Full backend response:', {
        response: response.status,
        data: data,
        success: data.success
      });
      
      if (data.success) {
        setCourse(data.data.course)
        setUserProgress(data.data.userProgress)
        setCanAccess(data.data.canAccess)
        
        // Debug enrollment status
        logger.info('COMPONENT', 'Course enrollment debug:', {
          courseId: data.data.course?.id,
          userProgress: data.data.userProgress,
          canAccess: data.data.canAccess,
          isEnrolled: !!data.data.userProgress,
          userProgressStatus: data.data.userProgress?.status,
          willShowEnrollButton: (!data.data.userProgress && data.data.canAccess),
          willShowUnenrollButton: !!(data.data.userProgress && data.data.userProgress.status !== 'unenrolled'),
          backendResponseData: data.data
        });
      } else {
        logger.error('ERROR', data.message || 'Failed to load course')
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching course:', { error: error })
      logger.error('ERROR', 'Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!course || !token) return
    
    // Additional check to prevent enrollment if already enrolled
    if (isEnrolled || userProgress) {
      alert('⚠️ Jūs jau esat pierakstījušies šajā kursā!\n\nLapa tiks atjaunota, lai parādītu jūsu aktuālo statusu.')
      await fetchCourseDetails()
      return
    }

    try {
      setEnrolling(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()
      
      // Debug enrollment response
      logger.info('COMPONENT', 'Enrollment attempt response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (response.ok && data.success) {
        analytics.courseEnroll('free', course.name || course.title || 'Unknown Course')
        
        // Show success message with training plan info
        if (confirm('🎉 Veiksmīgi pierakstījāties kursam!\n\n📅 Automātiski izveidots personalizēts treniņplāns ar 4 treniņiem nedēļā.\n\nVai vēlaties apskatīt savus plānotos treniņus tagad?')) {
          router.push('/workouts')
        } else {
          // Refresh course data to get updated enrollment status
          await fetchCourseDetails()
        }
      } else if (response.status === 409) {
        // User already enrolled
        alert('Jūs jau esat pierakstījušies šajā kursā! Lapa tiks atjaunota...')
        await fetchCourseDetails()
      } else {
        throw new Error(data.message || 'Failed to enroll in course')
      }
    } catch (error) {
      logger.error('ERROR', 'Enrollment error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  const handleGenerateTrainingPlan = async () => {
    if (!course || !token) return

    try {
      setGeneratingPlan(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userPreferences: {
            trainingDays: ['monday', 'wednesday', 'friday', 'sunday'],
            fitnessLevel: course.difficulty || 'beginner',
            weeklyDistanceGoal: course.category === 'beginner' ? 15 : 25,
            preferredWorkoutTypes: ['easy', 'tempo', 'long'],
            timeAvailable: 60,
            hasActivePlan: false,
            courseType: course.category,
            courseName: course.name || course.title
          }
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        alert('7-dienu treniņplāns veiksmīgi izveidots! Pārejiet uz Treniņplāni sadaļu lai to apskatītu.')
        analytics.workoutCreated()
      } else {
        throw new Error(data.message || 'Failed to generate training plan')
      }
    } catch (error) {
      logger.error('ERROR', 'Training plan generation error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to generate training plan')
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleGenerateWorkout = async () => {
    if (!course || !token) return

    // Always show date picker first, with tomorrow's date as default
    if (!showWorkoutDatePicker) {
      setWorkoutStartDate(getTomorrowDate()) // Set tomorrow as default
      setShowWorkoutDatePicker(true)
      return
    }

    // If modal is already shown, validate that date is selected
    if (!workoutStartDate) {
      return
    }

    try {
      setGeneratingWorkout(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'running',
          difficulty: course.difficulty || 'beginner',
          duration: 30, // minutes
          goals: ['endurance', 'technique'],
          courseId: course.id,
          workoutType: 'structured',
          startDate: workoutStartDate
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setWorkoutGenerated(true)
        setGeneratedWorkoutId(data.data?.workoutId || 'generated')
        setShowWorkoutDatePicker(false)
        analytics.workoutCreated()
        
        // Show success notification with option to navigate
        if (confirm('🎉 Skrējiena plāns veiksmīgi izveidots!\n\nTreniņš ir pievienots jūsu "Mani treniņi" sadaļā kā "Plānots" treniņš.\n\nVai vēlaties atvērt treniņu sadaļu tagad?')) {
          router.push('/workouts')
        }
      } else {
        throw new Error(data.message || 'Failed to generate workout')
      }
    } catch (error) {
      logger.error('ERROR', 'Workout generation error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to generate workout')
    } finally {
      setGeneratingWorkout(false)
    }
  }

  const handleCreateLessonPlan = async () => {
    if (!course || !token) return

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/courses/${course.id}/lesson-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType: 'progressive',
          duration: 'weekly',
          focus: course.category || 'general'
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        alert('Lekciju (vingrojumu) plāns izveidots! Tas ir pievienots jūsu kursa progress.')
        await fetchCourseDetails()
      } else {
        throw new Error(data.message || 'Failed to create lesson plan')
      }
    } catch (error) {
      logger.error('ERROR', 'Lesson plan creation error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to create lesson plan')
    }
  }

  const handleUnenroll = async () => {
    if (!course || !token) return
    
    if (!confirm('Vai tiešām vēlaties atteikties no šī kursa? Jūsu progress tiks saglabāts, bet jūs vairs nevarēsit piekļūt kursa saturam.')) {
      return
    }

    try {
      setUnenrolling(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/courses/${course.id}/unenroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'user_request'
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        alert('✅ Jūs esat veiksmīgi atteikušies no kursa.\n\nJūsu progress ir saglabāts un jūs varēsiet pierakstīties atkal, ja vēlēsities.')
        await fetchCourseDetails()
      } else {
        throw new Error(data.message || 'Failed to unenroll from course')
      }
    } catch (error) {
      logger.error('ERROR', 'Unenrollment error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to unenroll from course')
    } finally {
      setUnenrolling(false)
    }
  }

  const handleDeleteProgress = async () => {
    if (!course || !token) return
    
    if (!confirm('⚠️ Vai tiešām vēlaties PILNĪBĀ DZĒST visu savu progresu šajā kursā?\n\n🚨 BRĪDINĀJUMS: Šī darbība ir neatgriezeniska!\n\n✅ Ja vēlaties turpināt, noklikšķiniet OK\n❌ Ja vēlaties saglabāt progresu, noklikšķiniet Cancel un izmantojiet "Atteikties no kursa" pogu')) {
      return
    }

    // Double confirmation for such a destructive action
    if (!confirm('🔥 PĒDĒJAIS BRĪDINĀJUMS!\n\nViss jūsu progress (pabeigtas lekcijas, vērtējumi, laiks) tiks NEATGRIEZENISKI DZĒSTS!\n\nVai tiešām vēlaties turpināt?')) {
      return
    }

    try {
      setDeletingProgress(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/courses/${course.id}/progress`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        alert('✅ Jūsu kursa progress ir pilnībā dzēsts.\n\nJūs varat pierakstīties kursam no jauna, sākot ar 0% progresu.')
        await fetchCourseDetails()
      } else {
        throw new Error(data.message || 'Failed to delete course progress')
      }
    } catch (error) {
      logger.error('ERROR', 'Delete progress error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to delete course progress')
    } finally {
      setDeletingProgress(false)
    }
  }

  const handleCancelWorkout = async () => {
    if (!generatedWorkoutId || !token) return
    
    if (!confirm('❌ Vai tiešām vēlaties dzēst ieplānoto aktivitāti?\n\nŠī darbība atcels plānoto treniņu un tas tiks izņemts no jūsu treniņu saraksta.')) {
      return
    }

    try {
      setCancelingWorkout(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      // If it's a real workout ID, delete it from server
      if (generatedWorkoutId !== 'generated') {
        const response = await fetch(`${API_BASE_URL}/api/workouts/${generatedWorkoutId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          alert('✅ Ieplānotā aktivitāte ir veiksmīgi dzēsta no jūsu treniņu plāna.')
        }
      }
      
      // Reset local state regardless
      setWorkoutGenerated(false)
      setGeneratedWorkoutId(null)
      
    } catch (error) {
      logger.error('ERROR', 'Workout cancellation error:', { error: error })
      alert('❌ Neizdevās dzēst ieplānoto aktivitāti. Lūdzu, mēģiniet vēlreiz vai dodieties uz "Mani treniņi" sadaļu.')
    } finally {
      setCancelingWorkout(false)
    }
  }

  const handleStartCourse = () => {
    if (course && course.lessons && course.lessons.length > 0) {
      const firstLesson = course.lessons.find(l => l.isPublished) || course.lessons[0]
      router.push(`/courses/${course.id}/lessons/${firstLesson._id}`)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      </ProtectedLayout>
    )
  }

  if (false) { // Error display disabled for build
    return (
      <ProtectedLayout>
        <div className="min-h-screen gradient-bg">
          <div className="section-padding">
            <div className="container-custom">
              <div className="card-elevated text-center max-w-md mx-auto">
                <div className="text-red-500 text-xl font-semibold mb-4">
                  {"Temporary error"}
                </div>
                <button 
                  onClick={() => router.back()}
                  className="btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!course) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen gradient-bg">
          <div className="section-padding">
            <div className="container-custom">
              <div className="card-elevated text-center max-w-md mx-auto">
                <div className="text-gray-400 text-xl mb-4">
                  Course not found
                </div>
                <button 
                  onClick={() => router.push('/courses')}
                  className="btn-primary"
                >
                  Browse Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // More robust enrollment check
  const isEnrolled = userProgress && userProgress.status !== 'unenrolled'
  const courseName = course.name || course.title

  return (
    <ProtectedLayout>
      <div className="min-h-screen gradient-bg">
        {/* Course Header */}
        <div className="section-padding">
          <div className="container-custom">
            <div className="card-elevated mb-8 animate-fade-in-down">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                    <button 
                      onClick={() => router.push('/courses')}
                      className="hover:text-coral transition-colors"
                    >
                      Courses
                    </button>
                    <span>›</span>
                    <span className="capitalize text-coral">{course.category}</span>
                  </div>
                  
                  <h1 className="text-heading-1 gradient-text mb-6">
                    {courseName}
                  </h1>
                  
                  <p className="text-body-large text-gray-300 mb-8">
                    {course.shortDescription || course.description}
                  </p>
                
                  <div className="flex items-center space-x-8 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-400">Level:</span>
                      <span className="capitalize text-coral font-semibold">{course.level || course.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-400">Duration:</span>
                      <span className="text-gray-300">{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-400">Lessons:</span>
                      <span className="text-gray-300">{course.totalLessons || course.lessons?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-400">Students:</span>
                      <span className="text-coral font-semibold">{course.enrolledCount}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-8 flex-shrink-0">
                  {course.imageUrl && (
                    <img 
                      src={course.imageUrl} 
                      alt={courseName}
                      className="w-64 h-48 object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="card-elevated mb-8">
                  <h2 className="text-2xl font-bold mb-6 gradient-text">About This Course</h2>
                  <div className="text-gray-300 leading-relaxed space-y-4">
                    <p>{course.description}</p>
                  
                  {course.id === '689f34e6b75897a3d279f01d' && (
                    <>
                      <p>
                        This comprehensive beginner's guide covers all the essentials you need to start your running journey safely and effectively. 
                        Whether you're completely new to running or returning after a break, this course will help you build a strong foundation.
                      </p>
                      
                      <h3 className="text-lg font-semibold text-coral mt-8 mb-4">What You'll Learn:</h3>
                      <ul className="list-none space-y-3">
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> Proper running form and breathing techniques</li>
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> How to choose the right running shoes and gear</li>
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> Creating a sustainable training schedule</li>
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> Injury prevention and recovery strategies</li>
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> Nutrition and hydration for runners</li>
                        <li className="flex items-center"><span className="text-coral mr-3">✓</span> Goal setting and motivation techniques</li>
                      </ul>
                      
                      <h3 className="text-lg font-semibold text-coral mt-8 mb-4">Course Benefits:</h3>
                      <ul className="list-none space-y-3">
                        <li className="flex items-center"><span className="text-coral mr-3">🎯</span> Build endurance progressively and safely</li>
                        <li className="flex items-center"><span className="text-coral mr-3">🏃‍♂️</span> Develop proper running habits from the start</li>
                        <li className="flex items-center"><span className="text-coral mr-3">🛡️</span> Reduce injury risk with expert guidance</li>
                        <li className="flex items-center"><span className="text-coral mr-3">📋</span> Access to personalized 7-day training plans</li>
                        <li className="flex items-center"><span className="text-coral mr-3">👥</span> Join a supportive community of beginner runners</li>
                      </ul>
                      
                      <div className="gradient-surface p-6 rounded-2xl mt-8 border border-coral/20">
                        <h4 className="font-medium text-coral mb-3 flex items-center">
                          🎯 <span className="ml-2">Perfect for:</span>
                        </h4>
                        <p className="text-gray-300 text-sm">
                          Complete beginners, returning runners, those who want to improve their form, 
                          and anyone looking to build a sustainable running routine.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Course Lessons */}
                {course.lessons && course.lessons.length > 0 && (
                  <div className="card-elevated">
                    <h2 className="text-2xl font-bold mb-6 gradient-text">Course Content</h2>
                    <div className="space-y-3">
                      {course.lessons
                        .filter(lesson => lesson.isPublished)
                        .sort((a, b) => a.order - b.order)
                        .map((lesson, index) => (
                        <div 
                          key={lesson._id} 
                          onClick={() => {
                            if (!isEnrolled) {
                              alert('Jums ir jāpierakstās kursam, lai piekļūtu lekcijām!')
                              return
                            }
                            
                            // Check if lesson is unlocked
                            const isUnlocked = lesson.order === 1 || (userProgress?.lessonProgress && 
                              course.lessons?.filter(l => l.isPublished && l.order < lesson.order)
                                .every(prevLesson => userProgress.lessonProgress[prevLesson._id]?.completed))
                            
                            if (isUnlocked) {
                              router.push(`/courses/${course.id}/lessons/${lesson._id}`)
                            } else {
                              alert('🔒 Šī lekcija ir slēgta. Lūdzu, pabeigiet iepriekšējās lekcijas, lai to atbloķētu.')
                            }
                          }}
                          className={`flex items-center justify-between p-4 border border-gray-700/30 rounded-xl transition-all duration-300 ${
                            !isEnrolled ? 'cursor-not-allowed opacity-60' : 
                            (lesson.order === 1 || (userProgress?.lessonProgress && 
                             course.lessons?.filter(l => l.isPublished && l.order < lesson.order)
                               .every(prevLesson => userProgress.lessonProgress[prevLesson._id]?.completed)))
                              ? 'cursor-pointer hover:bg-gray-800/30 hover:border-coral/30' 
                              : 'cursor-not-allowed opacity-60 bg-gray-900/20'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            {(() => {
                              const isCompleted = userProgress?.lessonProgress?.[lesson._id]?.completed || false
                              const isUnlocked = lesson.order === 1 || (userProgress?.lessonProgress && 
                                course.lessons?.filter(l => l.isPublished && l.order < lesson.order)
                                  .every(prevLesson => userProgress.lessonProgress[prevLesson._id]?.completed))
                              
                              return (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${
                                  isCompleted
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : !isUnlocked
                                    ? 'bg-gray-800 text-gray-600 border-gray-700/30'
                                    : 'bg-coral/20 text-coral border-coral/30'
                                }`}>
                                  {isCompleted ? '✓' : !isUnlocked ? '🔒' : index + 1}
                                </div>
                              )
                            })()}
                            <div>
                              <h3 className="font-medium text-gray-300">{lesson.title}</h3>
                              <p className="text-sm text-gray-400">{lesson.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span className="capitalize">{lesson.type}</span>
                            <span>•</span>
                            <span>{lesson.duration}min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="card-elevated sticky top-8">
                {userProgress && (
                  <div className="mb-6 p-4 gradient-surface rounded-xl border border-coral/20">
                    <h3 className="font-medium text-coral mb-2">Your Progress</h3>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-coral h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${userProgress.completionPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      {userProgress.completedLessons} of {userProgress.totalLessons} lessons completed
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-3xl font-bold gradient-text mb-2">
                    {course.price > 0 ? `${course.price} ${course.currency}` : 'Free'}
                  </div>
                  {course.features && course.features.length > 0 && (
                    <ul className="text-sm text-gray-300 space-y-1">
                      {course.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-coral mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Show enrollment section only for non-enrolled users */}
                {(!isEnrolled && canAccess) && (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary w-full mb-3"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {isEnrolled && (
                  <>
                    <button
                      onClick={handleStartCourse}
                      className="w-full px-6 py-3 bg-green-600/80 text-white rounded-xl font-medium hover:bg-green-600 mb-3 transition-all duration-300 border border-green-600/30"
                    >
                      {userProgress?.completionPercentage > 0 ? 'Continue Course' : 'Start Course'}
                    </button>
                    
                    <div className="space-y-3 mb-4">
                      <button
                        onClick={handleGenerateTrainingPlan}
                        disabled={generatingPlan}
                        className="w-full px-6 py-3 bg-purple-600/80 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-purple-600/30"
                      >
                        {generatingPlan ? 'Generating...' : '🏃‍♂️ Generate 7-Day Training Plan'}
                      </button>
                      
                      {!workoutGenerated ? (
                        <button
                          onClick={handleGenerateWorkout}
                          disabled={generatingWorkout}
                          className="w-full px-6 py-3 bg-orange-600/80 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-orange-600/30"
                        >
                          {generatingWorkout ? 'Generating...' : '💪 Generate Workout'}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full px-6 py-3 bg-green-500/20 text-green-400 rounded-xl font-medium text-center border border-green-500/30">
                            ✅ Workout Generated!
                          </div>
                          <button
                            onClick={handleCancelWorkout}
                            disabled={cancelingWorkout}
                            className="w-full px-6 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-red-500/30 transition-all duration-300"
                          >
                            {cancelingWorkout ? 'Canceling...' : '❌ Cancel Workout'}
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={handleCreateLessonPlan}
                        className="w-full px-6 py-3 bg-indigo-600/80 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all duration-300 border border-indigo-600/30"
                      >
                        📝 Create Exercise Plan
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={handleUnenroll}
                        disabled={unenrolling}
                        className="w-full px-6 py-2 bg-gray-700/50 text-gray-300 rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/30 text-sm transition-all duration-300"
                      >
                        {unenrolling ? 'Atteicos...' : '🚪 Atteikties no kursa'}
                      </button>
                      
                      <button
                        onClick={handleDeleteProgress}
                        disabled={deletingProgress}
                        className="w-full px-6 py-2 bg-red-700/50 text-red-300 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed border border-red-600/30 text-sm transition-all duration-300"
                      >
                        {deletingProgress ? 'Dzēšu...' : '🗑️ Dzēst progresu pilnībā'}
                      </button>
                    </div>
                  </>
                )}

                {!canAccess && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                    <p className="text-sm text-yellow-400">
                      This course requires a higher subscription level to access.
                    </p>
                    <button
                      onClick={() => router.push('/subscription')}
                      className="mt-2 text-sm text-yellow-300 hover:text-yellow-200 underline transition-colors"
                    >
                      Upgrade subscription
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700/30 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Instructor</span>
                    <span className="font-medium text-gray-300">{course.instructorName || 'Running Academy'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Rating</span>
                    <span className="font-medium text-coral">{course.rating || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Students</span>
                    <span className="font-medium text-coral">{course.enrolledCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Workout Start Date Picker Modal */}
  {showWorkoutDatePicker && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card-elevated max-w-md w-full mx-4">
        <h3 className="text-xl font-bold gradient-text mb-4">
          Apstiprināt treniņa datumu
        </h3>
        <p className="text-gray-400 mb-6">
          Pēc noklusējuma treniņš tiks plānots rītdienai. Ja vēlaties, varat izvēlēties citu datumu.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Treniņa sākuma datums
          </label>
          
          {/* Quick Date Options */}
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setWorkoutStartDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1 text-sm rounded-lg border transition-all duration-300 ${
                workoutStartDate === new Date().toISOString().split('T')[0]
                  ? 'bg-blue-600/80 text-white border-blue-600/30'
                  : 'bg-gray-700/50 text-gray-300 border-gray-600/30 hover:bg-gray-700'
              }`}
            >
              Šodien
            </button>
            <button
              onClick={() => setWorkoutStartDate(getTomorrowDate())}
              className={`px-3 py-1 text-sm rounded-lg border transition-all duration-300 ${
                workoutStartDate === getTomorrowDate()
                  ? 'bg-coral/80 text-white border-coral/30'
                  : 'bg-gray-700/50 text-gray-300 border-gray-600/30 hover:bg-gray-700'
              }`}
            >
              Rīt (ieteicams)
            </button>
          </div>
          
          <input
            type="date"
            value={workoutStartDate}
            onChange={(e) => setWorkoutStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input-field w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            Selected date: {workoutStartDate ? new Date(workoutStartDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Nav izvēlēts'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowWorkoutDatePicker(false)
              setWorkoutStartDate('')
            }}
            className="flex-1 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-all duration-300"
          >
            Atcelt
          </button>
          <button
            onClick={handleGenerateWorkout}
            disabled={!workoutStartDate || generatingWorkout}
            className="flex-1 px-4 py-2 bg-orange-600/80 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {generatingWorkout ? 'Ģenerē...' : 'Izveidot treniņu'}
          </button>
        </div>
      </div>
    </div>
  )}

    </ProtectedLayout>
  )
}

export default withAuth(CourseDetailPage)