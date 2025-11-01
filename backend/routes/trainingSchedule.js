import express from 'express';
import { MonthlySchedule } from '../models/mongodb/trainingPlan/monthlySchedule.model.js';
import { TrainingProgramSkeleton } from '../models/mongodb/trainingPlan/trainingProgramSkeleton.model.js';
import scheduleUpdateService from '../services/scheduleUpdateService.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';

const router = express.Router();

// Get user's current monthly schedule
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date();
    
    const schedule = await MonthlySchedule.findOne({
      userId: userId,
      status: 'active',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).sort({ createdAt: -1 });

    if (!schedule) {
      return res.status(404).json({ 
        error: 'No active training schedule found',
        message: 'Neaktīva treniņu programma nav atrasta' 
      });
    }

    res.json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error('Error fetching current schedule:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schedule',
      message: 'Neizdevās ielādēt treniņu programmu' 
    });
  }
});

// Get schedule for specific month
router.get('/:year/:month', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.params;
    
    const schedule = await MonthlySchedule.findOne({
      userId: userId,
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!schedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: 'Šim mēnesim nav atrasta treniņu programma' 
      });
    }

    res.json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schedule',
      message: 'Neizdevās ielādēt treniņu programmu' 
    });
  }
});

// Update session status (complete, miss, reschedule)
router.patch('/session/:scheduleId/:weekIndex/:day', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scheduleId, weekIndex, day } = req.params;
    const { status, performance, notes } = req.body;

    const schedule = await MonthlySchedule.findOne({
      _id: scheduleId,
      userId: userId
    });

    if (!schedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: 'Treniņu programma nav atrasta' 
      });
    }

    const week = schedule.weeks[weekIndex];
    if (!week || !week.schedule[day]) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Treniņa sesija nav atrasta' 
      });
    }

    const session = week.schedule[day];
    
    // Update session
    session.status = status;
    if (notes) session.notes = notes;
    
    if (status === 'completed') {
      session.completedAt = new Date();
      if (performance) {
        session.performance = { ...session.performance, ...performance };
        session.actualDuration = performance.duration || session.actualDuration;
        session.actualDistance = performance.distance || session.actualDistance;
      }
    }

    // Update week stats
    schedule.updateWeekStats(weekIndex);
    
    // Update month stats
    schedule.updateMonthStats();

    await schedule.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      session: session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ 
      error: 'Failed to update session',
      message: 'Neizdevās atjaunināt treniņa sesiju' 
    });
  }
});

// Reschedule a session to another day
router.patch('/reschedule/:scheduleId/:weekIndex', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scheduleId, weekIndex } = req.params;
    const { fromDay, toDay, reason } = req.body;

    const schedule = await MonthlySchedule.findOne({
      _id: scheduleId,
      userId: userId
    });

    if (!schedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: 'Treniņu programma nav atrasta' 
      });
    }

    const week = schedule.weeks[weekIndex];
    if (!week) {
      return res.status(404).json({ 
        error: 'Week not found',
        message: 'Nedēļa nav atrasta' 
      });
    }

    const fromSession = week.schedule[fromDay];
    const toSession = week.schedule[toDay];

    if (!fromSession || !toSession) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'Treniņa sesija nav atrasta' 
      });
    }

    // Check if target day is available (rest day or flexible session)
    if (toSession.type !== 'rest' && !toSession.isFlexible) {
      return res.status(400).json({ 
        error: 'Target day not available',
        message: 'Mērķa diena nav pieejama pārcelšanai' 
      });
    }

    // Store original target session
    const originalToSession = { ...toSession };

    // Move session
    toSession.type = fromSession.type;
    toSession.intensity = fromSession.intensity;
    toSession.plannedDuration = fromSession.plannedDuration;
    toSession.plannedDistance = fromSession.plannedDistance;
    toSession.description = fromSession.description;
    toSession.isFlexible = fromSession.isFlexible;
    toSession.status = 'moved';

    // Clear original session or move what was there
    if (originalToSession.type === 'rest') {
      fromSession.type = 'rest';
      fromSession.intensity = 'recovery';
      fromSession.plannedDuration = 0;
      fromSession.plannedDistance = 0;
      fromSession.description = '';
    } else {
      // Swap sessions
      fromSession.type = originalToSession.type;
      fromSession.intensity = originalToSession.intensity;
      fromSession.plannedDuration = originalToSession.plannedDuration;
      fromSession.plannedDistance = originalToSession.plannedDistance;
      fromSession.description = originalToSession.description;
    }

    fromSession.status = 'moved';
    fromSession.notes = `Pārcelts uz ${toDay}`;
    toSession.notes = `Pārcelts no ${fromDay}`;

    // Log the change
    schedule.adaptationLog.push({
      date: new Date(),
      type: 'user_request',
      reason: reason || 'User rescheduled session',
      changes: [{
        day: fromDay,
        field: 'rescheduled',
        oldValue: fromDay,
        newValue: toDay
      }],
      adaptedBy: 'user',
      impact: 'minor'
    });

    await schedule.save();

    res.json({
      success: true,
      message: 'Session rescheduled successfully',
      fromSession: fromSession,
      toSession: toSession
    });
  } catch (error) {
    console.error('Error rescheduling session:', error);
    res.status(500).json({ 
      error: 'Failed to reschedule session',
      message: 'Neizdevās pārcelt treniņa sesiju' 
    });
  }
});

// Request adaptation for upcoming sessions
router.post('/adapt/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scheduleId } = req.params;
    const { adaptationType, reason, targetWeek } = req.body;

    const schedule = await MonthlySchedule.findOne({
      _id: scheduleId,
      userId: userId
    });

    if (!schedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: 'Treniņu programma nav atrasta' 
      });
    }

    // Get the skeleton for adaptation rules
    const skeleton = await TrainingProgramSkeleton.findOne({
      templateId: schedule.skeletonId
    });

    if (!skeleton) {
      return res.status(404).json({ 
        error: 'Training template not found',
        message: 'Treniņu programmas šablons nav atrasts' 
      });
    }

    // Apply adaptation based on type
    const adaptation = {
      type: adaptationType,
      reason: reason,
      adjustments: {}
    };

    switch (adaptationType) {
      case 'reduce_intensity':
        adaptation.adjustments = {
          intensityReduction: 0.2,
          convertToEasy: ['tempo', 'intervals']
        };
        break;
      case 'reduce_volume':
        adaptation.adjustments = {
          volumeReduction: 0.25
        };
        break;
      case 'add_rest':
        adaptation.adjustments = {
          addRestDay: true
        };
        break;
      case 'illness_recovery':
        adaptation.adjustments = {
          intensityReduction: 0.4,
          volumeReduction: 0.3,
          addRestDay: true
        };
        break;
    }

    // Apply to specified week or next week
    const weekIndex = targetWeek || schedule.weeks.findIndex(week => 
      new Date(week.startDate) > new Date()
    );

    if (weekIndex >= 0 && weekIndex < schedule.weeks.length) {
      scheduleUpdateService.applyAdaptationToWeek(
        schedule.weeks[weekIndex], 
        adaptation, 
        skeleton
      );

      // Log the adaptation
      schedule.adaptationLog.push({
        date: new Date(),
        type: 'user_request',
        reason: reason,
        changes: [{
          day: 'week',
          field: 'adaptation',
          oldValue: 'baseline',
          newValue: adaptationType
        }],
        adaptedBy: 'user',
        impact: 'moderate'
      });

      await schedule.save();

      res.json({
        success: true,
        message: 'Training plan adapted successfully',
        adaptedWeek: schedule.weeks[weekIndex]
      });
    } else {
      res.status(400).json({
        error: 'Invalid week specified',
        message: 'Norādītā nedēļa nav derīga'
      });
    }
  } catch (error) {
    console.error('Error adapting schedule:', error);
    res.status(500).json({ 
      error: 'Failed to adapt schedule',
      message: 'Neizdevās pielāgot treniņu programmu' 
    });
  }
});

// Get user's training statistics
router.get('/stats/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    
    // Only allow users to see their own stats unless admin
    if (userId !== req.user.userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Nav atļaujas skatīt citu lietotāju statistiku' 
      });
    }

    const schedules = await MonthlySchedule.find({
      userId: userId,
      status: { $in: ['active', 'completed'] }
    }).sort({ createdAt: -1 }).limit(6); // Last 6 months

    const stats = {
      totalSchedules: schedules.length,
      totalSessions: 0,
      completedSessions: 0,
      totalDistance: 0,
      totalDuration: 0,
      avgCompletionRate: 0,
      monthlyProgress: []
    };

    schedules.forEach(schedule => {
      stats.totalSessions += schedule.monthStats.totalPlannedSessions;
      stats.completedSessions += schedule.monthStats.totalCompletedSessions;
      stats.totalDistance += schedule.monthStats.totalActualDistance;
      stats.totalDuration += schedule.monthStats.totalActualDuration;

      stats.monthlyProgress.push({
        month: schedule.month,
        year: schedule.year,
        completionRate: schedule.monthStats.overallCompletionRate,
        distance: schedule.monthStats.totalActualDistance,
        sessions: schedule.monthStats.totalCompletedSessions
      });
    });

    if (stats.totalSessions > 0) {
      stats.avgCompletionRate = (stats.completedSessions / stats.totalSessions) * 100;
    }

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching training stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: 'Neizdevās ielādēt statistiku' 
    });
  }
});

// Admin: Trigger manual schedule update
router.post('/admin/trigger-update', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Nav administratora tiesību' 
      });
    }

    const { type, userId } = req.body;

    if (type === 'weekly') {
      await scheduleUpdateService.triggerWeeklyUpdate();
      res.json({ success: true, message: 'Weekly update triggered' });
    } else if (type === 'missed') {
      await scheduleUpdateService.triggerMissedSessionCheck();
      res.json({ success: true, message: 'Missed session check triggered' });
    } else {
      res.status(400).json({ error: 'Invalid update type' });
    }
  } catch (error) {
    console.error('Error triggering manual update:', error);
    res.status(500).json({ 
      error: 'Failed to trigger update',
      message: 'Neizdevās aktivizēt atjaunināšanu' 
    });
  }
});

export default router;