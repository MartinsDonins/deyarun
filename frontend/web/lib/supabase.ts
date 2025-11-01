// Backend-only authentication - Supabase client disabled
// All authentication is now handled through the backend API

import { getAuthToken } from '../utils/auth'
import { logger } from '../lib/productionLogger'

// Supabase is disabled - using backend authentication only
export const supabase = null

// Types for our user profile data
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthDate: string
  age?: number
  gender: string
  weight?: number
  height?: number
  fitnessLevel: string
  weeklyGoal: number
  preferredPace?: number
  runningExperience: string
  injuryHistory?: string
  preferredDistance: string
  timezone: string
  units: string
  
  // Extended training profile fields
  hasRunningExperience: boolean
  longestRunEver?: number
  longestRunLastMonth?: number
  personalBest5k?: number
  personalBest10k?: number
  workoutsPerWeekCurrent: number
  workoutsPerWeekLastMonth: number
  strengthTrainingPerWeek: number
  coreTrainingPerWeek: number
  otherActivities?: string
  hasRunningShoes: boolean
  runningShoesBrand?: string
  runningShoesModel?: string
  hasHeartRateMonitor: boolean
  monitorsHeartRate: boolean
  medicalConditions?: string
  currentInjuries?: string
  currentPain?: string
  hasExcessWeight: boolean
  targetEventType: string
  targetEventDate?: string
  trainingIntensityPref: string
  sleepHoursPerNight: number
  stressLevel: number
  nutritionQuality: number
  
  isEmailVerified: boolean
  isProfileComplete: boolean
  theme: string
  notificationsEnabled: boolean
  locationSharingEnabled: boolean
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// Authentication helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(userData: any) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }
    
    return data
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }
    
    return data
  },

  // Sign out
  async signOut() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Logout failed')
    }
    
    return data
  },

  // Get current session
  async getSession() {
    const token = getAuthToken()
    if (!token) return null

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })

    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data
  },

  // Reset password
  async resetPassword(email: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed')
    }
    
    return data
  },

  // Sign in with Google via backend API
  async signInWithGoogle() {
    try {
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/google`
    } catch (error) {
      logger.error('ERROR', 'Google sign in error:', { error: error })
      throw new Error('Google sign in is not available')
    }
  }
}