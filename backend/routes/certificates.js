// ✅ Certificates route - MongoDB Compatible
import express from 'express';
import mongoose from 'mongoose';
import { User, Course, UserProgress } from '../models/mongodb/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
console.log('✅ Certificates route enabled with MongoDB support');

// Certificate Schema
const CertificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  certificateId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  completionDate: { type: Date, required: true },
  grade: { type: Number, min: 0, max: 100 },
  skills: [String],
  issuedBy: { type: String, default: 'DeyaRun' },
  verificationCode: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'certificates' });

const Certificate = mongoose.model('Certificate', CertificateSchema);

// Get user certificates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const certificates = await Certificate.find({ userId })
      .populate('courseId', 'title description')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch certificates', message: error.message });
  }
});

// Generate certificate for completed course
router.post('/generate/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    
    // Check if course is completed
    const progress = await UserProgress.findOne({ userId, courseId });
    if (!progress || progress.completionPercentage < 100) {
      return res.status(400).json({ success: false, error: 'Course not completed' });
    }
    
    // Check if certificate already exists
    const existing = await Certificate.findOne({ userId, courseId });
    if (existing) {
      return res.json({ success: true, certificate: existing, message: 'Certificate already exists' });
    }
    
    const course = await Course.findById(courseId);
    const user = await User.findById(userId);
    
    const certificate = new Certificate({
      userId,
      courseId,
      certificateId: `CERT-${Date.now()}-${userId.toString().slice(-6)}`,
      title: `Certificate of Completion - ${course.title}`,
      completionDate: progress.completedAt,
      grade: progress.finalScore || 85,
      skills: course.skills || [],
      verificationCode: `VER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
    await certificate.save();
    res.status(201).json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate certificate', message: error.message });
  }
});

// Verify certificate
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const { verificationCode } = req.params;
    const certificate = await Certificate.findOne({ verificationCode })
      .populate('userId', 'firstName lastName')
      .populate('courseId', 'title description');
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    
    res.json({ success: true, certificate, verified: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify certificate', message: error.message });
  }
});
export default router;