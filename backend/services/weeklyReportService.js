// ✅ Weekly Report Service - MongoDB Compatible
import { User, Workout } from '../models/mongodb/index.js';
import ProgressTrackingService from './progressTrackingService.js';

console.log('✅ Weekly Report Service enabled with MongoDB support');

class WeeklyReportService {
  init() {
    console.log('Weekly report service initialized with MongoDB');
    this.scheduleWeeklyReports();
  }

  async generateWeeklyReport(userId) {
    try {
      const report = await ProgressTrackingService.generateWeeklyReport(userId);
      if (!report) return null;

      // Add additional weekly-specific analysis
      const enhancedReport = {
        ...report,
        reportType: 'weekly',
        generatedAt: new Date(),
        highlights: this.generateWeeklyHighlights(report),
        challenges: this.identifyWeeklyChallenges(report),
        nextWeekFocus: this.suggestNextWeekFocus(report)
      };

      return enhancedReport;
    } catch (error) {
      console.error('Generate weekly report error:', error);
      return null;
    }
  }

  async scheduleWeeklyReports() {
    console.log('Weekly report scheduling enabled');
    
    // Run every Sunday at 8 AM
    const scheduleWeeklyTask = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + (7 - now.getDay()));
      nextSunday.setHours(8, 0, 0, 0);
      
      const timeUntilSunday = nextSunday.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.generateAllUserReports();
        scheduleWeeklyTask(); // Schedule next week
      }, timeUntilSunday);
    };
    
    scheduleWeeklyTask();
  }

  async generateAllUserReports() {
    try {
      const users = await User.find({ subscriptionType: { $in: ['free', 'premium'] } });
      console.log(`Generating weekly reports for ${users.length} users`);
      
      for (const user of users) {
        await this.generateWeeklyReport(user._id);
      }
    } catch (error) {
      console.error('Generate all user reports error:', error);
    }
  }

  generateWeeklyHighlights(report) {
    const highlights = [];
    
    if (report.summary.workoutsCompleted >= report.goals.target) {
      highlights.push(`🎯 Goal achieved! Completed ${report.summary.workoutsCompleted} workouts`);
    }
    
    if (report.improvements.distance?.change > 0) {
      highlights.push(`📈 Distance improved by ${Math.round(report.improvements.distance.change/1000)}km`);
    }
    
    if (report.improvements.pace?.change > 0) {
      highlights.push(`⚡ Pace improved by ${Math.round(report.improvements.pace.change)}s/km`);
    }
    
    return highlights;
  }

  identifyWeeklyChallenges(report) {
    const challenges = [];
    
    if (report.summary.workoutsCompleted < report.goals.target) {
      challenges.push(`📊 Missed workout goal by ${report.goals.target - report.summary.workoutsCompleted} sessions`);
    }
    
    if (report.recommendations.some(r => r.priority === 'high')) {
      challenges.push('⚠️ High priority training adjustments needed');
    }
    
    return challenges;
  }

  suggestNextWeekFocus(report) {
    if (report.recommendations.length === 0) {
      return 'Maintain current training consistency';
    }
    
    const highPriority = report.recommendations.find(r => r.priority === 'high');
    if (highPriority) {
      return highPriority.message;
    }
    
    return report.recommendations[0].message;
  }
}

export default new WeeklyReportService();