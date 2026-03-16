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
    subject: 'Reset your password — Best Choice Tutors',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="font-size: 20px; color: #1a1a1a; margin-bottom: 8px;">Need a fresh start?</h2>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">No problem — we've got you. Click the button below to choose a new password and get back to your account.</p>
        <p style="margin: 24px 0 16px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">Reset my password →</a>
        </p>
        <p style="font-size: 14px; color: #666;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your account is secure.</p>
        <p style="font-size: 13px; color: #888; margin-top: 24px;">— The Best Choice Tutors Team</p>
      </div>
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
