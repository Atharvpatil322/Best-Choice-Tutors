import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

// Google OAuth callback handler
export const googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Google authentication failed' });
    }

    const { id, displayName, emails, photos } = req.user;
    const email = emails[0].value;
    const profilePhoto = photos && photos[0] ? photos[0].value : null;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - log them in (block if suspended or banned)
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        const message =
          user.status === 'BANNED' ? 'Account is banned' : 'Account is suspended';
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(message)}`
        );
      }

      // Generate JWT token
      const token = generateToken(user._id);

      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`
      );
    } else {
      // User does not exist - create new user
      user = await User.create({
        name: displayName,
        email: email,
        password: null, // No password for Google OAuth users
        authProvider: 'google',
        profilePhoto: profilePhoto,
        role: 'Learner', // Default role as per FR-3.1.3
      });

      // Generate JWT token
      const token = generateToken(user._id);

      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`
      );
    }
  } catch (error) {
    next(error);
  }
};
