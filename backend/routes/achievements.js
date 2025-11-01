// Achievement Routes - Real achievement system
import express from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import AchievementService from '../services/achievementService.js';

const router = express.Router();

// GET /api/user/achievements - Get user's achievements
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's achievements with progress and unlocked status
    const achievementData = await AchievementService.getUserAchievements(userId);
    
    console.log(`✅ Retrieved ${achievementData.achievements.length} achievements for user ${userId}`);
    
    res.json({
      success: true,
      ...achievementData // includes achievements array and summary
    });

  } catch (error) {
    console.error('❌ Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
      message: error.message
    });
  }
});

// POST /api/user/achievements/initialize - Initialize achievements for new user
router.post('/achievements/initialize', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Initialize default achievements for user
    const userAchievements = await AchievementService.initializeUserAchievements(userId);
    
    if (userAchievements) {
      console.log(`✅ Initialized ${userAchievements.length} achievements for user ${userId}`);
      res.json({
        success: true,
        message: 'Achievements initialized successfully',
        data: {
          initialized: userAchievements.length
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Achievements already exist for user',
        data: {
          initialized: 0
        }
      });
    }

  } catch (error) {
    console.error('❌ Error initializing user achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize achievements',
      message: error.message
    });
  }
});

// GET /api/achievements/seed - Seed default achievement definitions (admin)
router.get('/achievements/seed', async (req, res) => {
  try {
    // Seed default achievement definitions
    const seededAchievements = await AchievementService.seedDefaultAchievements();
    
    console.log(`✅ Seeded ${seededAchievements.length} default achievements`);
    
    res.json({
      success: true,
      message: 'Default achievements seeded successfully',
      data: {
        seeded: seededAchievements.length,
        achievements: seededAchievements.map(a => ({
          id: a.id,
          title: a.title,
          category: a.category,
          difficulty: a.difficulty
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed achievements',
      message: error.message
    });
  }
});

export default router;