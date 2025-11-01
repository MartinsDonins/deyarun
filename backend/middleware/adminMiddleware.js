import jwt from 'jsonwebtoken';
// import prisma from '../prismaClient.js'; // REMOVED: Migrated to MongoDB
import { User } from '../models/mongodb/index.js';
import { getJwtSecret } from '../utils/jwtUtils.js';

const adminMiddleware = async (req, res, next) => {
  try {
    // Support both cookies and Authorization headers (hybrid approach)
    const cookieToken = req.cookies?.authToken;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    
    // Find user by userId (primary), then postgresId or _id for compatibility
    const user = await User.findById(decoded.userId).select('email firstName lastName role permissions');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        userRole: user.role 
      });
    }

    req.user = {
      id: user._id,
      userId: user._id, // Add userId for compatibility with admin routes
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions
    };
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export default adminMiddleware;