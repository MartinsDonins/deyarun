// ✅ Quizzes route - MongoDB Compatible
import express from 'express';
import mongoose from 'mongoose';
import { User, Course } from '../models/mongodb/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
console.log('✅ Quizzes route enabled with MongoDB support');

// Quiz Schemas
const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['multiple_choice', 'true_false', 'text'], default: 'multiple_choice' },
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: String,
    points: { type: Number, default: 1 }
  }],
  timeLimit: { type: Number }, // in minutes
  passingScore: { type: Number, default: 70 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'quizzes' });

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  quizId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz' },
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    points: Number
  }],
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeSpent: { type: Number }, // in seconds
  completedAt: { type: Date, default: Date.now }
}, { collection: 'quizattempts' });

const Quiz = mongoose.model('Quiz', QuizSchema);
const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);

// Initialize default quizzes
const initializeDefaultQuizzes = async () => {
  try {
    const count = await Quiz.countDocuments();
    if (count === 0) {
      const defaultQuizzes = [
        {
          title: 'Running Basics Quiz',
          description: 'Test your knowledge of fundamental running concepts',
          questions: [
            {
              question: 'What is the recommended weekly mileage increase for beginners?',
              type: 'multiple_choice',
              options: ['5%', '10%', '15%', '20%'],
              correctAnswer: '10%',
              explanation: 'The 10% rule helps prevent overuse injuries by gradually increasing training load.',
              points: 2
            },
            {
              question: 'Should you stretch before running?',
              type: 'true_false',
              options: ['True', 'False'],
              correctAnswer: 'False',
              explanation: 'Dynamic warm-up is better than static stretching before running.',
              points: 1
            },
            {
              question: 'What part of the foot should you land on while running?',
              type: 'multiple_choice',
              options: ['Heel', 'Midfoot', 'Toes', 'It depends'],
              correctAnswer: 'Midfoot',
              explanation: 'Midfoot landing is generally most efficient and reduces injury risk.',
              points: 2
            }
          ],
          timeLimit: 10,
          passingScore: 70
        }
      ];
      
      await Quiz.insertMany(defaultQuizzes);
      console.log('Default quizzes initialized');
    }
  } catch (error) {
    console.error('Failed to initialize default quizzes:', error);
  }
};

// Initialize quizzes on startup
initializeDefaultQuizzes();

// Get all quizzes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    if (courseId) query.courseId = courseId;
    
    const quizzes = await Quiz.find(query)
      .populate('courseId', 'title')
      .select('-questions.correctAnswer -questions.explanation') // Hide answers
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Quiz.countDocuments(query);
    
    res.json({
      success: true,
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes', message: error.message });
  }
});

// Get quiz by ID (for taking quiz)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title')
      .select('-questions.correctAnswer -questions.explanation'); // Hide answers
    
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch quiz', message: error.message });
  }
});

// Submit quiz attempt
router.post('/:id/attempt', authMiddleware, async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.userId;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];
    
    quiz.questions.forEach((question, index) => {
      totalPoints += question.points;
      const userAnswer = answers.find(a => a.questionIndex === index);
      const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      earnedPoints += points;
      
      gradedAnswers.push({
        questionIndex: index,
        answer: userAnswer?.answer || '',
        isCorrect,
        points,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });
    
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;
    
    const attempt = new QuizAttempt({
      userId,
      quizId,
      answers: gradedAnswers,
      score: earnedPoints,
      percentage,
      passed,
      timeSpent
    });
    
    await attempt.save();
    
    res.json({
      success: true,
      attempt: {
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        answers: gradedAnswers
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit quiz', message: error.message });
  }
});

// Get user's quiz attempts
router.get('/attempts/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const attempts = await QuizAttempt.find({ userId })
      .populate('quizId', 'title description')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await QuizAttempt.countDocuments({ userId });
    
    res.json({
      success: true,
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch quiz attempts', message: error.message });
  }
});

// Get quiz statistics
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    
    const stats = await QuizAttempt.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          passRate: { $avg: { $cond: ['$passed', 1, 0] } },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch quiz stats', message: error.message });
  }
});
export default router;