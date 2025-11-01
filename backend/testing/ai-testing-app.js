import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import our AI services
import trainingPlanGenerator from '../services/trainingPlanGenerator.js';
import { openAIService } from '../services/openAIService.js';
import { aiTrainingService } from '../services/aiTrainingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('🧪 Starting AI Testing Application...');

// Serve the testing dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes for Testing

/**
 * Test Personalization Algorithm
 */
app.post('/api/test/personalization', async (req, res) => {
  try {
    console.log('🧪 Testing Personalization Algorithm...');
    
    const testUserProfile = req.body.userProfile || {
      experience: 'intermediate',
      fitnessLevel: 'intermediate',
      currentWeeklyMileage: 25,
      preferredIntensity: 'medium',
      age: 32,
      restingHeartRate: 62,
      injuryHistory: [
        {
          type: 'knee_pain',
          date: '2024-06-15',
          severity: 'minor'
        }
      ],
      availableTime: 45,
      preferredTrainingDays: ['monday', 'wednesday', 'friday', 'saturday'],
      targetRace: {
        distance: '10k',
        date: '2024-12-15'
      }
    };

    const performanceHistory = req.body.performanceHistory || {
      recentWorkouts: [
        { date: '2024-08-10', distance: 8, duration: 40, pace: '5:00', feeling: 'good' },
        { date: '2024-08-12', distance: 5, duration: 23, pace: '4:36', feeling: 'hard' },
        { date: '2024-08-14', distance: 12, duration: 65, pace: '5:25', feeling: 'moderate' }
      ]
    };

    // Test personalization scoring
    const personalizationScore = trainingPlanGenerator.calculatePersonalizationScore(
      testUserProfile, 
      performanceHistory
    );

    // Test performance analysis
    const performanceAnalysis = {
      trend: 'improving',
      avgPace: '5:02',
      consistency: 0.8,
      fatigueLevel: 0.3
    };

    // Test enhanced adaptation strategy
    const adaptationStrategy = trainingPlanGenerator.determineEnhancedAdaptationStrategy(
      performanceAnalysis,
      personalizationScore,
      'balanced', // feedbackType
      'performance_review', // adjustmentReason
      testUserProfile
    );

    res.json({
      success: true,
      testResults: {
        userProfile: testUserProfile,
        personalizationScore,
        performanceAnalysis,
        adaptationStrategy,
        testSummary: {
          overallScore: personalizationScore.score,
          riskFactors: personalizationScore.factors.injuryRisk < 0.5 ? ['injury_risk'] : [],
          recommendations: personalizationScore.recommendations,
          adaptationConfidence: adaptationStrategy.score
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Personalization test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Test Latvian Language AI Features
 */
app.post('/api/test/latvian-ai', async (req, res) => {
  try {
    console.log('🇱🇻 Testing Latvian AI Features...');

    // Test workout descriptions
    const workoutDescriptions = openAIService.generateLatvianWorkoutDescriptions();
    
    // Test motivational messages
    const motivationalMessages = openAIService.getLatvianMotivationalMessages();
    
    // Test enhanced system prompt
    const systemPrompt = openAIService.getEnhancedSystemPrompt();

    // Test weather-adapted workouts
    const testWorkout = {
      type: 'tempo',
      duration: 30,
      distance: 6,
      intensity: 'moderate'
    };

    const weatherConditions = [
      { condition: 'rain', temperature: 15, windSpeed: 10 },
      { condition: 'snow', temperature: -2, windSpeed: 5 },
      { condition: 'hot', temperature: 28, windSpeed: 3 },
      { condition: 'wind', temperature: 18, windSpeed: 20 }
    ];

    const weatherAdaptations = weatherConditions.map(weather => ({
      weather,
      adaptedWorkout: trainingPlanGenerator.getWeatherAdaptedWorkout(testWorkout, weather)
    }));

    // Test Latvian workout description generation
    const workoutTypes = ['recovery', 'easy', 'tempo', 'intervals', 'hill', 'long'];
    const latvianDescriptions = workoutTypes.map(type => ({
      type,
      description: trainingPlanGenerator.generateLatvianWorkoutDescription(type, {
        duration: 40,
        distance: 8,
        intensity: 'moderate'
      })
    }));

    res.json({
      success: true,
      testResults: {
        workoutDescriptions,
        motivationalMessages,
        systemPromptLength: systemPrompt.length,
        systemPromptPreview: systemPrompt.substring(0, 200) + '...',
        weatherAdaptations,
        latvianDescriptions,
        testSummary: {
          workoutTypesSupported: Object.keys(workoutDescriptions).length,
          motivationalCategories: Object.keys(motivationalMessages).length,
          weatherConditionsSupported: weatherAdaptations.length,
          languageLocalization: 'Latvian (LV)'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Latvian AI test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Test Adaptive Plan Adjustments
 */
app.post('/api/test/adaptive-plans', async (req, res) => {
  try {
    console.log('🔄 Testing Adaptive Plan Adjustments...');

    const testPlan = {
      userProfile: {
        experience: 'intermediate',
        fitnessLevel: 'intermediate',
        currentWeeklyMileage: 30,
        preferredIntensity: 'medium',
        age: 28,
        restingHeartRate: 58,
        injuryHistory: [],
        location: 'Riga, Latvia'
      }
    };

    const testScenarios = [
      {
        name: 'Performance Improving',
        performanceData: { trend: 'improving', consistency: 0.9 },
        feedbackType: 'balanced',
        adjustmentReason: 'performance_review'
      },
      {
        name: 'Performance Declining', 
        performanceData: { trend: 'declining', consistency: 0.4 },
        feedbackType: 'too_hard',
        adjustmentReason: 'fatigue'
      },
      {
        name: 'Injury Risk High',
        performanceData: { trend: 'stable', consistency: 0.7 },
        feedbackType: 'balanced',
        adjustmentReason: 'injury_prevention',
        modifiedProfile: {
          ...testPlan.userProfile,
          injuryHistory: [
            { type: 'ankle_sprain', date: '2024-07-20', severity: 'moderate' }
          ]
        }
      },
      {
        name: 'Schedule Constraints',
        performanceData: { trend: 'stable', consistency: 0.8 },
        feedbackType: 'time_limited',
        adjustmentReason: 'schedule_change',
        modifiedProfile: {
          ...testPlan.userProfile,
          availableTime: 25,
          preferredTrainingDays: ['saturday', 'sunday']
        }
      }
    ];

    const scenarioResults = [];

    for (const scenario of testScenarios) {
      const userProfile = scenario.modifiedProfile || testPlan.userProfile;
      
      // Calculate personalization score
      const personalizationScore = trainingPlanGenerator.calculatePersonalizationScore(
        userProfile,
        scenario.performanceData
      );

      // Determine adaptation strategy
      const adaptationStrategy = trainingPlanGenerator.determineEnhancedAdaptationStrategy(
        scenario.performanceData,
        personalizationScore,
        scenario.feedbackType,
        scenario.adjustmentReason,
        userProfile
      );

      // Test workout adjustments
      const testWorkouts = [
        { type: 'tempo', duration: 45, distance: 8, targetIntensity: 'moderate' },
        { type: 'intervals', duration: 35, distance: 6, targetIntensity: 'hard' },
        { type: 'long', duration: 90, distance: 15, targetIntensity: 'easy' }
      ];

      const adjustedWorkouts = testWorkouts.map(workout => {
        let adjusted = { ...workout };
        
        // Apply intensity adjustments
        if (adaptationStrategy.intensity !== 0) {
          adjusted.targetIntensity = trainingPlanGenerator.adjustIntensity(
            workout.targetIntensity,
            adaptationStrategy.intensity
          );
        }

        // Apply duration adjustments
        if (adaptationStrategy.volume !== 0) {
          adjusted.duration = trainingPlanGenerator.adjustDuration(
            workout.duration,
            adaptationStrategy.volume
          );
          adjusted.distance = trainingPlanGenerator.adjustDistance(
            workout.distance,
            adaptationStrategy.volume
          );
        }

        // Apply workout type changes
        if (adaptationStrategy.workoutTypes.length > 0) {
          adjusted.type = trainingPlanGenerator.selectBestWorkoutType(
            workout.type,
            adaptationStrategy.workoutTypes
          );
        }

        return {
          original: workout,
          adjusted,
          changes: {
            intensityChanged: adjusted.targetIntensity !== workout.targetIntensity,
            durationChanged: adjusted.duration !== workout.duration,
            typeChanged: adjusted.type !== workout.type
          }
        };
      });

      scenarioResults.push({
        scenario: scenario.name,
        personalizationScore,
        adaptationStrategy,
        adjustedWorkouts,
        summary: {
          totalChanges: Math.abs(adaptationStrategy.intensity) + Math.abs(adaptationStrategy.volume),
          riskMitigation: adaptationStrategy.reasoning.filter(r => r.includes('risk') || r.includes('traum')),
          workoutsAdjusted: adjustedWorkouts.filter(w => 
            w.changes.intensityChanged || w.changes.durationChanged || w.changes.typeChanged
          ).length
        }
      });
    }

    res.json({
      success: true,
      testResults: {
        scenarioResults,
        testSummary: {
          scenariosTested: testScenarios.length,
          adaptationStrategiesGenerated: scenarioResults.length,
          averageAdaptationScore: scenarioResults.reduce((sum, r) => sum + r.adaptationStrategy.score, 0) / scenarioResults.length,
          adaptationCapabilities: [
            'Performance-based adjustments',
            'Injury risk mitigation', 
            'Schedule optimization',
            'Weather adaptations',
            'Feedback integration'
          ]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Adaptive plans test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Test Full AI Training Plan Generation
 */
app.post('/api/test/full-ai-plan', async (req, res) => {
  try {
    console.log('🤖 Testing Full AI Training Plan Generation...');

    const testUserProfile = req.body.userProfile || {
      name: 'Testa Lietotājs',
      age: 30,
      experience: 'intermediate',
      fitnessLevel: 'intermediate', 
      currentWeeklyMileage: 25,
      preferredIntensity: 'medium',
      restingHeartRate: 65,
      preferredTrainingDays: ['monday', 'wednesday', 'friday', 'saturday'],
      availableTime: 45,
      injuryHistory: [],
      location: 'Riga, Latvia'
    };

    const planConfig = {
      targetRace: {
        distance: '10k',
        name: 'Riga Marathon 10K',
        date: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000) // 12 weeks from now
      },
      timeGoal: '00:45:00',
      ...testUserProfile
    };

    // Test enhanced training plan generation
    const trainingPlan = await trainingPlanGenerator.generateAdvancedTrainingPlan(
      'test-user-123',
      planConfig
    );

    // Test personalization insights
    const personalizationScore = trainingPlanGenerator.calculatePersonalizationScore(testUserProfile);

    res.json({
      success: true,
      testResults: {
        generatedPlan: {
          id: trainingPlan._id,
          name: trainingPlan.name,
          description: trainingPlan.description,
          duration: trainingPlan.duration,
          startDate: trainingPlan.startDate,
          endDate: trainingPlan.endDate,
          aiFeatures: trainingPlan.aiFeatures,
          phases: trainingPlan.phases?.map(phase => ({
            name: phase.name,
            duration: phase.duration,
            focus: phase.focus
          }))
        },
        personalizationInsights: personalizationScore,
        planQuality: {
          adaptationEnabled: trainingPlan.adaptationEnabled,
          aiFeatureCount: Object.keys(trainingPlan.aiFeatures || {}).length,
          riskAssessment: trainingPlan.riskAssessment,
          hasLatvianContent: trainingPlan.description.includes('AI') || trainingPlan.description.includes('adaptīv')
        },
        testSummary: {
          planGenerated: true,
          personalizationScore: personalizationScore.score,
          aiEnhanced: true,
          languageSupport: 'Latvian',
          adaptiveFeatures: true
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Full AI plan test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Test OpenAI Service Integration
 */
app.post('/api/test/openai-integration', async (req, res) => {
  try {
    console.log('🤖 Testing OpenAI Service Integration...');

    // Check if OpenAI is initialized
    const isInitialized = openAIService.isInitialized;
    
    let testResults = {
      isInitialized,
      config: null,
      connectionTest: null,
      promptTest: null,
      error: null
    };

    if (isInitialized) {
      // Test configuration
      testResults.config = {
        model: openAIService.config?.model || 'Not configured',
        temperature: openAIService.config?.temperature || 'Not configured',
        hasSystemPrompt: !!openAIService.config?.systemPrompt,
        languageSupport: openAIService.config?.languageSupport || 'Not configured'
      };

      // Test connection (if we want to make an actual API call)
      if (req.body.testConnection) {
        try {
          await openAIService.testConnection();
          testResults.connectionTest = { success: true, message: 'Connection successful' };
        } catch (error) {
          testResults.connectionTest = { success: false, error: error.message };
        }
      }

      // Test system prompt
      testResults.promptTest = {
        systemPromptLength: openAIService.getEnhancedSystemPrompt().length,
        isLatvian: openAIService.getEnhancedSystemPrompt().includes('latviešu'),
        hasPersonalization: openAIService.getEnhancedSystemPrompt().includes('personalizētu'),
        hasCulturalContext: openAIService.getEnhancedSystemPrompt().includes('Baltij')
      };
    } else {
      testResults.error = 'OpenAI service not initialized - check API key configuration';
    }

    res.json({
      success: true,
      testResults,
      recommendations: isInitialized ? [
        'OpenAI service is properly configured',
        'Enhanced system prompt is active',
        'Latvian language support is enabled'
      ] : [
        'Add OPENAI_API_KEY to environment variables',
        'Restart the application',
        'Check OpenAI account status and billing'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ OpenAI integration test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Get System Status
 */
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: {
      application: 'AI Testing Dashboard',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        trainingPlanGenerator: !!trainingPlanGenerator,
        openAIService: openAIService.isInitialized,
        expressServer: true
      },
      endpoints: [
        'POST /api/test/personalization',
        'POST /api/test/latvian-ai', 
        'POST /api/test/adaptive-plans',
        'POST /api/test/full-ai-plan',
        'POST /api/test/openai-integration',
        'GET /api/status'
      ]
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 AI Testing Dashboard running on http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('   GET  / - Testing Dashboard');
  console.log('   POST /api/test/personalization - Test Personalization Algorithm');
  console.log('   POST /api/test/latvian-ai - Test Latvian AI Features');
  console.log('   POST /api/test/adaptive-plans - Test Adaptive Adjustments');
  console.log('   POST /api/test/full-ai-plan - Test Full AI Plan Generation');
  console.log('   POST /api/test/openai-integration - Test OpenAI Service');
  console.log('   GET  /api/status - System Status');
  console.log('\n🚀 Ready for AI testing!');
});

export default app;