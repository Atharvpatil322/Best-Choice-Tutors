import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// JWT verification middleware
// This middleware ONLY verifies identity - no role-based authorization
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.userId).select(
      '-password -resetPasswordToken -resetPasswordExpires'
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      const message =
        user.status === 'BANNED' ? 'Account is banned' : 'Account is suspended';
      return res.status(403).json({ message });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
};
