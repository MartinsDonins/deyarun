// Enhanced Supabase Authentication Service for DeyaRun
import { supabase, supabaseAdmin } from '../config/supabaseClient.js';
import prisma from '../prismaClient.js';
import bcrypt from 'bcryptjs';

class SupabaseAuthService {
  // Register user in both Supabase and PostgreSQL
  async registerWithSupabase(userData) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        ...profileData
      } = userData;

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
        }
      });

      if (authError) {
        throw new Error(`Supabase auth error: ${authError.message}`);
      }

      // 2. Create user in PostgreSQL with full profile
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Calculate age from birthDate
      const birthDateObj = new Date(profileData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();

      const user = await prisma.user.create({
        data: {
          id: authData.user.id, // Use Supabase user ID
          firstName,
          lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone: profileData.phone || null,
          birthDate: birthDateObj,
          age,
          gender: profileData.gender,
          weight: profileData.weight ? parseFloat(profileData.weight) : null,
          height: profileData.height ? parseFloat(profileData.height) : null,
          
          // Extended training profile fields
          hasRunningExperience: profileData.hasRunningExperience || false,
          longestRunEver: profileData.longestRunEver ? parseFloat(profileData.longestRunEver) : null,
          longestRunLastMonth: profileData.longestRunLastMonth ? parseFloat(profileData.longestRunLastMonth) : null,
          personalBest5k: profileData.personalBest5k ? parseInt(profileData.personalBest5k) : null,
          personalBest10k: profileData.personalBest10k ? parseInt(profileData.personalBest10k) : null,
          workoutsPerWeekCurrent: profileData.workoutsPerWeekCurrent ? parseInt(profileData.workoutsPerWeekCurrent) : 0,
          workoutsPerWeekLastMonth: profileData.workoutsPerWeekLastMonth ? parseInt(profileData.workoutsPerWeekLastMonth) : 0,
          strengthTrainingPerWeek: profileData.strengthTrainingPerWeek ? parseInt(profileData.strengthTrainingPerWeek) : 0,
          coreTrainingPerWeek: profileData.coreTrainingPerWeek ? parseInt(profileData.coreTrainingPerWeek) : 0,
          otherActivities: profileData.otherActivities || null,
          hasRunningShoes: profileData.hasRunningShoes || false,
          runningShoesBrand: profileData.runningShoesBrand || null,
          runningShoesModel: profileData.runningShoesModel || null,
          hasHeartRateMonitor: profileData.hasHeartRateMonitor || false,
          monitorsHeartRate: profileData.monitorsHeartRate || false,
          medicalConditions: profileData.medicalConditions || null,
          currentInjuries: profileData.currentInjuries || null,
          currentPain: profileData.currentPain || null,
          hasExcessWeight: profileData.hasExcessWeight || false,
          targetEventType: profileData.targetEventType || 'general',
          targetEventDate: profileData.targetEventDate ? new Date(profileData.targetEventDate) : null,
          trainingIntensityPref: profileData.trainingIntensityPref || 'moderate',
          sleepHoursPerNight: profileData.sleepHoursPerNight ? parseFloat(profileData.sleepHoursPerNight) : 8.0,
          stressLevel: profileData.stressLevel ? parseInt(profileData.stressLevel) : 3,
          nutritionQuality: profileData.nutritionQuality ? parseInt(profileData.nutritionQuality) : 3,
          
          // Defaults
          fitnessLevel: profileData.fitnessLevel || 'beginner',
          weeklyGoal: profileData.weeklyGoal ? parseInt(profileData.weeklyGoal) : 20,
          runningExperience: profileData.runningExperience || 'beginner',
          preferredDistance: profileData.preferredDistance || '5k',
          timezone: profileData.timezone || 'UTC',
          units: profileData.units || 'metric',
          isEmailVerified: false,
          isProfileComplete: !!(profileData.weight && profileData.height),
          theme: 'dark',
          notificationsEnabled: true,
          locationSharingEnabled: false
        }
      });

      return {
        success: true,
        user: authData.user,
        session: authData.session,
        profileData: user
      };

    } catch (error) {
      console.error('Supabase registration error:', error);
      throw error;
    }
  }

  // Login user with Supabase
  async loginWithSupabase(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(`Login failed: ${error.message}`);
      }

      // Update last login in PostgreSQL
      await prisma.user.update({
        where: { id: data.user.id },
        data: { lastLoginAt: new Date() }
      });

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      console.error('Supabase login error:', error);
      throw error;
    }
  }

  // Get user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Session error: ${error.message}`);
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(`Logout error: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`
      });

      if (error) {
        throw new Error(`Password reset error: ${error.message}`);
      }

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(`Password update error: ${error.message}`);
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error) {
        throw new Error(`Token verification error: ${error.message}`);
      }

      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Sync user data between Supabase and PostgreSQL
  async syncUserData(supabaseUserId) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

      if (error || !user) {
        throw new Error('User not found in Supabase');
      }

      // Get user from PostgreSQL
      const pgUser = await prisma.user.findUnique({
        where: { id: supabaseUserId }
      });

      if (!pgUser) {
        throw new Error('User not found in PostgreSQL');
      }

      // Update email verification status if changed
      if (user.email_confirmed_at && !pgUser.isEmailVerified) {
        await prisma.user.update({
          where: { id: supabaseUserId },
          data: { isEmailVerified: true }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('User sync error:', error);
      throw error;
    }
  }
}

export default new SupabaseAuthService();