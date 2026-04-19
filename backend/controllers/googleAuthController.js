import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const buildFrontendIndexRedirect = (query) => {
  const qs = new URLSearchParams(query).toString();
  return `${getFrontendBaseUrl()}/index.html${qs ? `?${qs}` : ''}`;
};

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
        return res.redirect(buildFrontendIndexRedirect({ error: message }));
      }

      // Generate JWT token
      const token = generateToken(user._id);

      return res.redirect(buildFrontendIndexRedirect({ token }));
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

      // Send welcome email asynchronously; do not block or fail on email errors
      sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) =>
        console.error('Welcome email send failed:', err?.message)
      );

      // Generate JWT token
      const token = generateToken(user._id);

      return res.redirect(buildFrontendIndexRedirect({ token }));
    }
  } catch (error) {
    next(error);
  }
};
