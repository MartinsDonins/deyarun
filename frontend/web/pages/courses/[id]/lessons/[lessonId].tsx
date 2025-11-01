import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import ProtectedLayout from '../../../../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../../../../contexts/AuthContext'
import { analytics } from '../../../../lib/analytics'
import DOMPurify from 'dompurify'
import { logger } from '../../../../lib/productionLogger'

interface Lesson {
  _id: string
  title: string
  description: string
  content?: string
  type: string
  duration: number
  order: number
  isPublished: boolean
  videoUrl?: string
  resourceLinks?: string[]
}

interface Course {
  id: string
  name: string
  title: string
  description: string
  category: string
  level: string
  difficulty: string
  lessons?: Lesson[]
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
      timeSpent: number
      lastAccessed: string
    }
  }
}

function LessonPage() {
  const router = useRouter()
  const { id, lessonId } = router.query
  const { user, token } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingLesson, setCompletingLesson] = useState(false)

  useEffect(() => {
    if (id && lessonId) {
      fetchLessonData()
      analytics.pageView('lesson-view')
    }
  }, [id, lessonId, token])

  const fetchLessonData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      // Fetch course data with lessons
      const courseResponse = await fetch(`${API_BASE_URL}/api/courses/${id}?includeProgress=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!courseResponse.ok) {
        if (courseResponse.status === 404) {
          setError('Course not found')
          return
        }
        throw new Error(`HTTP ${courseResponse.status}`)
      }

      const courseData = await courseResponse.json()
      
      if (courseData.success) {
        const courseInfo = courseData.data.course
        setCourse(courseInfo)
        setUserProgress(courseData.data.userProgress)
        
        // Find the specific lesson
        const foundLesson = courseInfo.lessons?.find((l: Lesson) => l._id === lessonId)
        if (foundLesson) {
          setLesson(foundLesson)
        } else {
          setError('Lesson not found')
        }
      } else {
        setError(courseData.message || 'Failed to load lesson')
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching lesson:', { error: error })
      setError('Failed to load lesson data')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLesson = async () => {
    if (!lesson || !course || !token) return
    
    try {
      setCompletingLesson(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/courses/${course.id}/lessons/${lesson._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeSpent: lesson.duration * 60, // Convert minutes to seconds
          completed: true
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        analytics.lessonCompleted(lesson.title)
        
        // Refresh lesson data to get updated progress
        await fetchLessonData()
        
        alert('✅ Lekcija pabeigta! Jūsu progress ir atjaunināts.')
      } else {
        throw new Error(data.message || 'Failed to mark lesson as complete')
      }
    } catch (error) {
      logger.error('ERROR', 'Lesson completion error:', { error: error })
      alert(error instanceof Error ? error.message : 'Failed to complete lesson')
    } finally {
      setCompletingLesson(false)
    }
  }

  const getNextLesson = () => {
    if (!course?.lessons || !lesson) return null
    
    const publishedLessons = course.lessons
      .filter(l => l.isPublished)
      .sort((a, b) => a.order - b.order)
    
    const currentIndex = publishedLessons.findIndex(l => l._id === lesson._id)
    return currentIndex < publishedLessons.length - 1 ? publishedLessons[currentIndex + 1] : null
  }

  const isLessonUnlocked = (lessonToCheck: Lesson) => {
    if (!course?.lessons || !userProgress) return false
    
    // First lesson is always unlocked
    if (lessonToCheck.order === 1) return true
    
    const publishedLessons = course.lessons
      .filter(l => l.isPublished)
      .sort((a, b) => a.order - b.order)
    
    const lessonIndex = publishedLessons.findIndex(l => l._id === lessonToCheck._id)
    
    // Check if all previous lessons are completed
    for (let i = 0; i < lessonIndex; i++) {
      const previousLesson = publishedLessons[i]
      const isCompleted = userProgress.lessonProgress?.[previousLesson._id]?.completed || false
      if (!isCompleted) {
        return false
      }
    }
    
    return true
  }

  const getPreviousLesson = () => {
    if (!course?.lessons || !lesson) return null
    
    const publishedLessons = course.lessons
      .filter(l => l.isPublished)
      .sort((a, b) => a.order - b.order)
    
    const currentIndex = publishedLessons.findIndex(l => l._id === lesson._id)
    return currentIndex > 0 ? publishedLessons[currentIndex - 1] : null
  }

  const isLessonCompleted = () => {
    if (!userProgress?.lessonProgress || !lesson) return false
    return userProgress.lessonProgress[lesson._id]?.completed || false
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

  if (error) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen gradient-bg">
          <div className="section-padding">
            <div className="container-custom">
              <div className="card-elevated text-center max-w-md mx-auto">
                <div className="text-red-500 text-xl font-semibold mb-4">
                  {error}
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

  if (!lesson || !course) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen gradient-bg">
          <div className="section-padding">
            <div className="container-custom">
              <div className="card-elevated text-center max-w-md mx-auto">
                <div className="text-gray-400 text-xl mb-4">
                  Lesson not found
                </div>
                <button 
                  onClick={() => router.push(`/courses/${id}`)}
                  className="btn-primary"
                >
                  Back to Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()
  const completed = isLessonCompleted()

  return (
    <ProtectedLayout>
      <div className="min-h-screen gradient-bg">
        <div className="section-padding">
          <div className="container-custom">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
              <button 
                onClick={() => router.push('/courses')}
                className="hover:text-coral transition-colors"
              >
                Courses
              </button>
              <span>›</span>
              <button 
                onClick={() => router.push(`/courses/${id}`)}
                className="hover:text-coral transition-colors"
              >
                {course.name || course.title}
              </button>
              <span>›</span>
              <span className="text-coral">{lesson.title}</span>
            </div>

            {/* Lesson Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="card-elevated">
                  {/* Lesson Header */}
                  <div className="border-b border-gray-700/30 pb-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-coral/20 text-coral rounded-full flex items-center justify-center text-sm font-medium border border-coral/30">
                          {lesson.order}
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold gradient-text">
                            {lesson.title}
                          </h1>
                          <p className="text-gray-400 text-sm mt-1">
                            {lesson.type} • {lesson.duration} minutes
                          </p>
                        </div>
                      </div>
                      
                      {completed && (
                        <div className="flex items-center space-x-2 text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                          <span className="text-sm">✓</span>
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-lg">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Video Content */}
                  {lesson.videoUrl && (
                    <div className="mb-8">
                      <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
                        <iframe
                          src={lesson.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={lesson.title}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lesson Content */}
                  <div className="prose prose-invert prose-coral max-w-none mb-8">
                    {lesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
                        ALLOW_DATA_ATTR: false,
                        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button']
                      }) }} />
                    ) : (
                      <div className="text-gray-300 space-y-4">
                        <p>This lesson covers the fundamentals of {lesson.title.toLowerCase()}.</p>
                        
                        {lesson._id === '689f34e6b75897a3d279f01e' && (
                          <>
                            <h3 className="text-xl font-semibold text-coral">Getting Started with Running</h3>
                            <p>
                              Welcome to your first lesson in the beginner's running course! In this lesson, we'll cover 
                              the essential basics you need to know before you take your first step.
                            </p>
                            
                            <h4 className="text-lg font-medium text-coral">What You'll Learn:</h4>
                            <ul className="list-disc list-inside space-y-2">
                              <li>How to choose the right running shoes for your foot type</li>
                              <li>Basic running gear and what you actually need vs. what's nice to have</li>
                              <li>Understanding different types of running (easy runs, tempo runs, intervals)</li>
                              <li>Setting realistic goals for your first month of running</li>
                              <li>Creating a safe and sustainable routine</li>
                            </ul>
                            
                            <h4 className="text-lg font-medium text-coral">Key Takeaways:</h4>
                            <div className="bg-coral/10 border border-coral/20 rounded-lg p-4">
                              <ul className="space-y-2">
                                <li>• Start slow and build gradually - your body needs time to adapt</li>
                                <li>• Invest in proper running shoes from a specialty store</li>
                                <li>• Listen to your body and rest when needed</li>
                                <li>• Focus on time running rather than distance when starting</li>
                                <li>• Consistency is more important than intensity</li>
                              </ul>
                            </div>
                            
                            <h4 className="text-lg font-medium text-coral">Next Steps:</h4>
                            <p>
                              After completing this lesson, you should have a good understanding of the basics. 
                              In the next lesson, we'll dive into proper running form and breathing techniques.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resource Links */}
                  {lesson.resourceLinks && lesson.resourceLinks.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-coral mb-4">Additional Resources</h3>
                      <div className="space-y-2">
                        {lesson.resourceLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:border-coral/30 transition-colors"
                          >
                            <span className="text-coral hover:text-coral/80">
                              📎 Resource {index + 1}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lesson Actions */}
                  <div className="border-t border-gray-700/30 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        {previousLesson && (
                          <button
                            onClick={() => router.push(`/courses/${id}/lessons/${previousLesson._id}`)}
                            className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                          >
                            ← Previous Lesson
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        {!completed && (
                          <button
                            onClick={handleCompleteLesson}
                            disabled={completingLesson}
                            className="px-6 py-2 bg-green-600/80 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                          >
                            {completingLesson ? 'Marking Complete...' : 'Mark as Complete'}
                          </button>
                        )}
                        
                        {nextLesson && (
                          <button
                            onClick={() => {
                              const isNextUnlocked = isLessonUnlocked(nextLesson)
                              if (isNextUnlocked) {
                                router.push(`/courses/${id}/lessons/${nextLesson._id}`)
                              } else {
                                alert('🔒 Nākošā lekcija ir slēgta. Lūdzu, atzīmējiet pašreizējo lekciju kā pabeigtu, lai turpinātu.')
                              }
                            }}
                            className={`px-4 py-2 rounded-xl transition-colors ${
                              isLessonUnlocked(nextLesson)
                                ? 'bg-coral/80 text-white hover:bg-coral'
                                : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!isLessonUnlocked(nextLesson)}
                          >
                            {isLessonUnlocked(nextLesson) ? 'Next Lesson →' : '🔒 Next Lesson'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="card-elevated sticky top-8">
                  <h3 className="text-lg font-semibold gradient-text mb-4">Course Progress</h3>
                  
                  {userProgress && (
                    <div className="mb-6">
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-coral h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${userProgress.completionPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {userProgress.completedLessons} of {userProgress.totalLessons} lessons completed
                      </p>
                    </div>
                  )}

                  {/* Lesson List */}
                  {course.lessons && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-300 mb-3">All Lessons</h4>
                      {course.lessons
                        .filter(l => l.isPublished)
                        .sort((a, b) => a.order - b.order)
                        .map((l) => {
                          const isCurrentLesson = l._id === lesson._id
                          const isCompleted = userProgress?.lessonProgress?.[l._id]?.completed || false
                          const isUnlocked = isLessonUnlocked(l)
                          
                          return (
                            <div key={l._id} className="relative">
                              <button
                                onClick={() => {
                                  if (isUnlocked) {
                                    router.push(`/courses/${id}/lessons/${l._id}`)
                                  } else {
                                    alert('🔒 Šī lekcija ir slēgta. Lūdzu, pabeigiet iepriekšējās lekcijas, lai to atbloķētu.')
                                  }
                                }}
                                disabled={!isUnlocked}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-300 ${
                                  !isUnlocked
                                    ? 'bg-gray-900/50 border border-gray-800/30 text-gray-500 cursor-not-allowed opacity-60'
                                    : isCurrentLesson
                                    ? 'bg-coral/20 border border-coral/30 text-coral'
                                    : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:bg-gray-800 hover:border-gray-600/30'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    !isUnlocked
                                      ? 'bg-gray-800 text-gray-600 border border-gray-700/30'
                                      : isCompleted
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : isCurrentLesson
                                      ? 'bg-coral/20 text-coral border border-coral/30'
                                      : 'bg-gray-700 text-gray-400 border border-gray-600/30'
                                  }`}>
                                    {!isUnlocked ? '🔒' : isCompleted ? '✓' : l.order}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-medium text-sm ${!isUnlocked ? 'text-gray-500' : ''}`}>
                                      {l.title}
                                    </div>
                                    <div className="text-xs text-gray-400">{l.duration}min</div>
                                  </div>
                                </div>
                              </button>
                              
                              {!isUnlocked && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">🔒</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(LessonPage)