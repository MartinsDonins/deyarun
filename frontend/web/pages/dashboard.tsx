import { useState, useEffect } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import EmailVerificationBanner from '../components/EmailVerificationBanner'
import Footer from '../components/Footer'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { analytics } from '../utils/analytics'

// Import new modern Dashboard components
import DashboardMain from '../components/dashboard/DashboardMain'
import { logger } from '../lib/productionLogger'

function Dashboard() {
  const { user } = useAuth()
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalWorkouts: 0,
    avgPace: 0,
    weeklyGoal: 0,
    weeklyProgress: 0,
    streakDays: 0,
    totalTime: 0,
    favoriteDistance: '5K',
    isRealData: false
  })
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [upcomingPlans, setUpcomingPlans] = useState([])
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Fetch user training data and track dashboard view
  useEffect(() => {
    if (user) {
      fetchUserStats()
      fetchRecentWorkouts()
      fetchUpcomingPlans()
      
      // Track dashboard view with analytics
      analytics.trackContentView('dashboard', 'main-dashboard', 'User Dashboard');
      analytics.trackEngagement({
        content_type: 'dashboard',
        content_id: 'main-dashboard',
        engagement_time_msec: Date.now()
      });
    }
  }, [user])


  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        logger.info('COMPONENT', 'No token found, skipping stats fetch')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      logger.info('COMPONENT', 'Stats response status:', { status: response.status })
      
      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Stats data received:', { data })
        
        // Handle different response structures
        const stats = data.data?.stats || data.stats || data
        
        // Check if we have real workout data - just check if workouts exist
        const hasRealWorkouts = stats.totalWorkouts > 0
        
        setUserStats({
          totalDistance: stats.totalDistance || 0,
          totalWorkouts: stats.totalWorkouts || 0,
          avgPace: stats.avgPace || 0,
          weeklyGoal: user?.weeklyGoal || stats.weeklyGoal || 0,
          weeklyProgress: stats.weeklyProgress || 0,
          streakDays: stats.streakDays || 0,
          totalTime: stats.totalTime || 0,
          favoriteDistance: user?.preferredDistance || stats.favoriteDistance || '5K',
          isRealData: stats.isRealData || hasRealWorkouts
        })
        setStatsLoaded(true)
      } else {
        const errorText = await response.text()
        logger.warn('WARNING', 'Stats fetch failed:', { status: response.status, errorText })
        
        // Use user's profile data if available
        setUserStats({
          totalDistance: 0,
          totalWorkouts: 0,
          avgPace: 0,
          weeklyGoal: user?.weeklyGoal || 0,
          weeklyProgress: 0,
          streakDays: 0,
          totalTime: 0,
          favoriteDistance: user?.preferredDistance || '5K',
          isRealData: false
        })
        setStatsLoaded(true)
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching user stats:', { error: error })
      // Use user's profile data if available
      setUserStats({
        totalDistance: 0,
        totalWorkouts: 0,
        avgPace: 0,
        weeklyGoal: user?.weeklyGoal || 0,
        weeklyProgress: 0,
        streakDays: 0,
        totalTime: 0,
        favoriteDistance: user?.preferredDistance || '5K',
        isRealData: false
      })
      setStatsLoaded(true)
    }
  }

  const fetchRecentWorkouts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        logger.info('COMPONENT', 'No token found, skipping workouts fetch')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts/recent?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      logger.info('COMPONENT', 'Workouts response status:', { status: response.status })
      
      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Workouts data received:', { data })
        setRecentWorkouts(data.workouts || data.data?.workouts || [])
      } else {
        logger.warn('WARNING', 'Workouts fetch failed:', { status: response.status })
        setRecentWorkouts([])
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching recent workouts:', { error: error })
      setRecentWorkouts([])
    }
  }

  const fetchUpcomingPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        logger.info('COMPONENT', 'No token found, skipping plans fetch')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/training-plans/upcoming?limit=3`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      logger.info('COMPONENT', 'Plans response status:', { status: response.status })
      
      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Plans data received:', { data })
        setUpcomingPlans(data.plans || data.data?.plans || [])
      } else {
        logger.warn('WARNING', 'Plans fetch failed:', { status: response.status })
        setUpcomingPlans([])
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching upcoming plans:', { error: error })
      setUpcomingPlans([])
    }
  }





  // Function to refresh all data
  const refreshAllData = () => {
    logger.info('COMPONENT', 'Refreshing dashboard data...')
    setStatsLoaded(false)
    fetchUserStats()
    fetchRecentWorkouts()
    fetchUpcomingPlans()
  }

  return (
    <ProtectedLayout>
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Modern Dashboard Main Component */}
        <DashboardMain
          user={user}
          userStats={userStats}
          recentWorkouts={recentWorkouts}
          upcomingPlans={upcomingPlans}
          onRefresh={refreshAllData}
        />


      </div>

      {/* Footer */}
      <Footer />
    </ProtectedLayout>
  )
}

export default withAuth(Dashboard)