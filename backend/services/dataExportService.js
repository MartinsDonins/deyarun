import User from '../models/mongodb/user/user.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';
import { Goal } from '../models/mongodb/goal.model.js';
import { WorkoutAnalyticsService } from './workoutAnalyticsService.js';
import { GoalTrackingService } from './goalTrackingService.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import archiver from 'archiver';
import { Parser } from 'json2csv';
import stream from 'stream';
import path from 'path';

export class DataExportService {
  
  /**
   * Export user workouts in various formats
   */
  static async exportWorkouts(userId, options = {}) {
    const {
      format = 'csv',
      startDate = null,
      endDate = null,
      includeGPS = false
    } = options;

    console.log(`🏃 Exporting workouts for user ${userId} (${format})`);

    // Build query
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Fetch workouts
    let workouts = await Workout.find(query)
      .sort({ date: -1 })
      .limit(1000); // Limit for performance

    // Transform data for export
    const exportData = workouts.map(workout => {
      const baseData = {
        id: workout._id,
        date: workout.date.toISOString(),
        type: workout.type,
        distance_km: workout.distance ? (workout.distance / 1000).toFixed(2) : 0,
        duration_minutes: workout.duration ? Math.round(workout.duration / 60) : 0,
        pace_per_km: workout.averagePace ? this.formatPace(workout.averagePace) : null,
        calories: workout.calories || null,
        average_heart_rate: workout.averageHeartRate || null,
        max_heart_rate: workout.maxHeartRate || null,
        elevation_gain_m: workout.elevationGain || 0,
        weather: workout.weather ? `${workout.weather.temperature}°C, ${workout.weather.conditions}` : null,
        notes: workout.notes || null,
        source: workout.source || 'manual',
        created_at: workout.createdAt.toISOString()
      };

      // Include GPS data if requested
      if (includeGPS && workout.route && workout.route.coordinates) {
        baseData.gps_coordinates = JSON.stringify(workout.route.coordinates);
        baseData.start_location = workout.route.startLocation ? JSON.stringify(workout.route.startLocation) : null;
        baseData.end_location = workout.route.endLocation ? JSON.stringify(workout.route.endLocation) : null;
      }

      return baseData;
    });

    // Format based on requested format
    switch (format) {
      case 'csv':
        return this.generateCSV(exportData, 'workouts');
      case 'xlsx':
        return this.generateXLSX(exportData, 'workouts');
      case 'json':
      default:
        return {
          data: JSON.stringify({
            export_type: 'workouts',
            generated_at: new Date().toISOString(),
            total_records: exportData.length,
            filters: { startDate, endDate, includeGPS },
            data: exportData
          }, null, 2),
          filename: `workouts_${userId}_${new Date().toISOString().split('T')[0]}.json`
        };
    }
  }

  /**
   * Export user goals data
   */
  static async exportGoals(userId, options = {}) {
    const {
      format = 'csv',
      includeProgress = true,
      status = null
    } = options;

    console.log(`🎯 Exporting goals for user ${userId}`);

    const query = { userId };
    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    const exportData = await Promise.all(goals.map(async goal => {
      const baseData = {
        id: goal._id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        category: goal.category,
        status: goal.status,
        priority: goal.priority,
        target_value: goal.target.value,
        target_unit: goal.target.unit,
        current_value: goal.current.value,
        progress_percentage: Math.round((goal.current.value / goal.target.value) * 100),
        start_date: goal.timeline.startDate.toISOString(),
        end_date: goal.timeline.endDate.toISOString(),
        created_at: goal.createdAt.toISOString(),
        updated_at: goal.updatedAt.toISOString()
      };

      if (includeProgress) {
        try {
          const analytics = await GoalTrackingService.calculateGoalAnalytics(goal._id);
          baseData.trend = analytics.trend;
          baseData.completion_rate = analytics.completionRate;
          baseData.days_remaining = analytics.daysRemaining;
          baseData.milestones_completed = goal.timeline.milestones.filter(m => m.achieved).length;
          baseData.total_milestones = goal.timeline.milestones.length;
        } catch (error) {
          console.warn(`⚠️ Could not fetch analytics for goal ${goal._id}:`, error.message);
        }
      }

      return baseData;
    }));

    switch (format) {
      case 'csv':
        return this.generateCSV(exportData, 'goals');
      case 'xlsx':
        return this.generateXLSX(exportData, 'goals');
      case 'json':
      default:
        return {
          data: JSON.stringify({
            export_type: 'goals',
            generated_at: new Date().toISOString(),
            total_records: exportData.length,
            filters: { status, includeProgress },
            data: exportData
          }, null, 2),
          filename: `goals_${userId}_${new Date().toISOString().split('T')[0]}.json`
        };
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  static async generateAnalyticsReport(userId, options = {}) {
    const {
      format = 'pdf',
      period = '3months',
      includeCharts = true
    } = options;

    console.log(`📊 Generating analytics report for user ${userId}`);

    // Fetch user info
    const user = await User.findById(userId);
    
    // Get analytics data
    const analytics = await WorkoutAnalyticsService.getPerformanceAnalytics(userId, {
      timeframe: period,
      metrics: ['pace', 'distance', 'duration', 'frequency']
    });

    const trends = await WorkoutAnalyticsService.getProgressTrends(userId, {
      timeframe: period,
      metrics: 'pace,distance,duration'
    });

    // Get goals summary
    const goalsAnalytics = await GoalTrackingService.getGoalsAnalyticsSummary(userId, period);

    if (format === 'pdf') {
      return this.generatePDFReport(user, analytics, trends, goalsAnalytics, period);
    } else if (format === 'json') {
      return {
        data: JSON.stringify({
          report_type: 'analytics',
          user_id: userId,
          period,
          generated_at: new Date().toISOString(),
          user_info: {
            name: user.name,
            email: user.email,
            member_since: user.createdAt
          },
          performance_analytics: analytics,
          progress_trends: trends,
          goals_analytics: goalsAnalytics
        }, null, 2),
        filename: `analytics_report_${userId}_${period}.json`
      };
    }

    // Default CSV format
    const reportData = [
      {
        section: 'Performance Summary',
        metric: 'Total Workouts',
        value: analytics.summary?.totalWorkouts || 0,
        period
      },
      {
        section: 'Performance Summary',
        metric: 'Total Distance (km)',
        value: analytics.summary?.totalDistance ? (analytics.summary.totalDistance / 1000).toFixed(2) : 0,
        period
      },
      {
        section: 'Performance Summary',
        metric: 'Average Pace (min/km)',
        value: analytics.summary?.averagePace ? this.formatPace(analytics.summary.averagePace) : 'N/A',
        period
      },
      {
        section: 'Goals Summary',
        metric: 'Active Goals',
        value: goalsAnalytics.totalGoals,
        period
      },
      {
        section: 'Goals Summary',
        metric: 'Completed Goals',
        value: goalsAnalytics.completedGoals,
        period
      }
    ];

    return this.generateCSV(reportData, 'analytics_report');
  }

  /**
   * Export complete user data package
   */
  static async exportCompleteUserData(userId, options = {}) {
    const {
      format = 'zip',
      includeGPS = false
    } = options;

    console.log(`📦 Generating complete export for user ${userId}`);

    if (format === 'zip') {
      return this.generateCompleteZipExport(userId, includeGPS);
    }

    // JSON format - all data in one file
    const [workouts, goals, user] = await Promise.all([
      this.exportWorkouts(userId, { format: 'json', includeGPS }),
      this.exportGoals(userId, { format: 'json', includeProgress: true }),
      User.findById(userId)
    ]);

    const completeData = {
      export_type: 'complete_user_data',
      generated_at: new Date().toISOString(),
      user_info: {
        id: user._id,
        name: user.name,
        email: user.email,
        member_since: user.createdAt,
        profile: user.profile
      },
      workouts: JSON.parse(workouts.data),
      goals: JSON.parse(goals.data)
    };

    return {
      data: JSON.stringify(completeData, null, 2),
      filename: `complete_export_${userId}_${new Date().toISOString().split('T')[0]}.json`
    };
  }

  /**
   * Generate CSV data
   */
  static generateCSV(data, type) {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      
      return {
        data: csv,
        filename: `${type}_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      throw new Error(`Failed to generate CSV: ${error.message}`);
    }
  }

  /**
   * Generate Excel file
   */
  static generateXLSX(data, type) {
    try {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, type);
      
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return {
        data: buffer,
        filename: `${type}_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      throw new Error(`Failed to generate Excel file: ${error.message}`);
    }
  }

  /**
   * Generate PDF report
   */
  static generatePDFReport(user, analytics, trends, goalsAnalytics, period) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          resolve({
            data: Buffer.concat(chunks),
            filename: `analytics_report_${user._id}_${period}.pdf`
          });
        });

        // Header
        doc.fontSize(20).text('DeyaRun Analytics Report', { align: 'center' });
        doc.moveDown();
        
        // User Info
        doc.fontSize(16).text('User Information');
        doc.fontSize(12)
           .text(`Name: ${user.name}`)
           .text(`Email: ${user.email}`)
           .text(`Member Since: ${user.createdAt.toLocaleDateString()}`)
           .text(`Report Period: ${period}`)
           .text(`Generated: ${new Date().toLocaleDateString()}`);
        
        doc.moveDown();

        // Performance Summary
        if (analytics.summary) {
          doc.fontSize(16).text('Performance Summary');
          doc.fontSize(12)
             .text(`Total Workouts: ${analytics.summary.totalWorkouts || 0}`)
             .text(`Total Distance: ${analytics.summary.totalDistance ? (analytics.summary.totalDistance / 1000).toFixed(2) + ' km' : '0 km'}`)
             .text(`Average Pace: ${analytics.summary.averagePace ? this.formatPace(analytics.summary.averagePace) : 'N/A'}`)
             .text(`Total Duration: ${analytics.summary.totalDuration ? Math.round(analytics.summary.totalDuration / 60) + ' minutes' : '0 minutes'}`);
          
          doc.moveDown();
        }

        // Goals Summary
        if (goalsAnalytics) {
          doc.fontSize(16).text('Goals Summary');
          doc.fontSize(12)
             .text(`Total Goals: ${goalsAnalytics.totalGoals}`)
             .text(`Active Goals: ${goalsAnalytics.activeGoals}`)
             .text(`Completed Goals: ${goalsAnalytics.completedGoals}`)
             .text(`Goal Completion Rate: ${goalsAnalytics.completionRate?.toFixed(1)}%`);
        }

        doc.end();
      } catch (error) {
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }

  /**
   * Generate complete ZIP export
   */
  static async generateCompleteZipExport(userId, includeGPS) {
    return new Promise(async (resolve, reject) => {
      try {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks = [];

        archive.on('data', chunk => chunks.push(chunk));
        archive.on('end', () => {
          resolve({
            data: Buffer.concat(chunks),
            filename: `complete_export_${userId}_${new Date().toISOString().split('T')[0]}.zip`
          });
        });
        archive.on('error', reject);

        // Export workouts
        const workouts = await this.exportWorkouts(userId, { format: 'csv', includeGPS });
        archive.append(workouts.data, { name: workouts.filename });

        // Export goals
        const goals = await this.exportGoals(userId, { format: 'csv', includeProgress: true });
        archive.append(goals.data, { name: goals.filename });

        // Export analytics report
        const analytics = await this.generateAnalyticsReport(userId, { format: 'pdf' });
        archive.append(analytics.data, { name: analytics.filename });

        // Add README
        const readme = this.generateExportReadme(userId);
        archive.append(readme, { name: 'README.txt' });

        archive.finalize();
      } catch (error) {
        reject(new Error(`Failed to generate ZIP export: ${error.message}`));
      }
    });
  }

  /**
   * Generate README for exports
   */
  static generateExportReadme(userId) {
    return `DeyaRun Data Export
Generated: ${new Date().toLocaleString()}
User ID: ${userId}

This export contains:
- workouts_*.csv: Your workout data in CSV format
- goals_*.csv: Your goals and progress data
- analytics_report_*.pdf: Comprehensive analytics report

File Formats:
- CSV files can be opened in Excel, Google Sheets, or any spreadsheet application
- PDF files require a PDF reader

Data Privacy:
This export contains your personal fitness data. Please store it securely and only share with trusted parties.

For questions about your data export, contact support at hello@deyarun.com
`;
  }

  /**
   * Queue export request for large datasets
   */
  static async queueExportRequest(userId, options) {
    // This would integrate with a job queue system like Bull or Agenda
    // For now, return a mock response
    const requestId = `export_${userId}_${Date.now()}`;
    
    console.log(`📮 Queuing export request ${requestId}`);
    
    return {
      id: requestId,
      estimatedTime: '5-10 minutes',
      status: 'queued'
    };
  }

  /**
   * Get export request status
   */
  static async getExportStatus(requestId, userId) {
    // Mock implementation - would check actual job queue
    return {
      status: 'completed',
      progress: 100,
      downloadUrl: `/api/data-export/download/${requestId}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Get appropriate HTTP headers for export format
   */
  static getExportHeaders(format, type) {
    const timestamp = new Date().toISOString().split('T')[0];
    
    const headers = {
      'csv': {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_${timestamp}.csv"`
      },
      'xlsx': {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_${timestamp}.xlsx"`
      },
      'json': {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${type}_${timestamp}.json"`
      },
      'pdf': {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_${timestamp}.pdf"`
      },
      'zip': {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${type}_${timestamp}.zip"`
      }
    };

    return headers[format] || headers.json;
  }

  /**
   * Helper: Format pace from decimal minutes to MM:SS
   */
  static formatPace(paceMinutes) {
    if (!paceMinutes) return null;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}