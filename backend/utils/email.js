import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// TODO: CLARIFICATION REQUIRED - Should we support multiple email providers or just SMTP?
const createTransporter = () => {
  // TODO: CLARIFICATION REQUIRED - What should happen if email configuration is missing?
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration missing. Email functionality will not work.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Best Choice Tutors',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};
