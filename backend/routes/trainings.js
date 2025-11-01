import { Router } from 'express';
import Training from '../models/training.model.js';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';

const router = Router();

// Return a simple training plan
router.get('/plan', (req, res) => {
  const plan = {
    name: '5km Beginner Plan',
    nextRun: '2025-07-01',
    detail: 'Easy 3km run'
  };
  res.json(plan);
});

// Create a new training session
router.post('/create', authMiddleware, async (req, res) => {
  const { distance, duration } = req.body;
  if (!distance || !duration) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const training = await Training.create({
      user: req.user.userId,
      distance,
      duration
    });
    res.status(201).json(training);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create training' });
  }
});

// Get a training session by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const training = await Training.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    if (!training) return res.status(404).json({ message: 'Not found' });
    res.json(training);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch training' });
  }
});

// Complete a training session with feedback
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const training = await Training.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { completed: true, feedback: req.body.feedback },
      { new: true }
    );
    if (!training) return res.status(404).json({ message: 'Not found' });
    res.json(training);
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete training' });
  }
});

// Delete a training session
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const training = await Training.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    if (!training) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete training' });
  }
});

export default router;
