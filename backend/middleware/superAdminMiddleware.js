import jwt from 'jsonwebtoken';
// import prisma from '../prismaClient.js'; // REMOVED: Migrated to MongoDB
import { User } from '../models/mongodb/index.js';
import { getJwtSecret } from '../utils/jwtUtils.js';

const superAdminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    
    // Find user by userId (primary)
    const user = await User.findById(decoded.userId).select('email firstName lastName role permissions');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Check if user has super admin privileges
    if (user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Access denied. Super admin privileges required.',
        userRole: user.role 
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions
    };
    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export default superAdminMiddleware;