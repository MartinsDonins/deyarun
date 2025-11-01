import { Router } from 'express';
import { hybridAuthMiddleware as authMiddleware } from '../middleware/cookieAuthMiddleware.js';
import Route from '../models/route.model.js';

const router = Router();

// Get saved routes for authenticated user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const routes = await Route.find({ user: req.user.userId }).select('name createdAt');
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load routes' });
  }
});

// Save a new route
router.post('/save', authMiddleware, async (req, res) => {
  const { name, track } = req.body;
  if (!name || !Array.isArray(track) || track.length === 0) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const route = await Route.create({ user: req.user.userId, name, track });
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save route' });
  }
});

// Sync data from wearables
router.post('/sync/:provider', (req, res) => {
  const { provider } = req.params;
  res.json({ message: `Synced with ${provider}` });
});

export default router;
