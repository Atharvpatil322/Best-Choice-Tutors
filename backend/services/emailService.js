import nodemailer from 'nodemailer';

/**
 * Reusable email service for transactional emails (welcome, tutor upgrade, verification approvals, etc.).
 * Uses EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM. Sends asynchronously; failures are logged only.
 */

const getConfig = () => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;
  return { host, port, user, pass, from };
};

const isConfigured = () => {
  const { host, user, pass } = getConfig();
  return !!(host && user && pass);
};

/** Missing SMTP env keys (for logs only; never log secrets). */
export function getMissingSmtpEnvKeys() {
  const { host, user, pass } = getConfig();
  const missing = [];
  if (!host || !String(host).trim()) missing.push("EMAIL_HOST");
  if (!user || !String(user).trim()) missing.push("EMAIL_USER");
  if (!pass || !String(pass).trim()) missing.push("EMAIL_PASS");
  return missing;
}

/** Log once at startup so missing welcome/onboarding email config is obvious. */
export function logTransactionalEmailStatus() {
  const { host, port, from, user } = getConfig();
  if (isConfigured()) {
    console.log(
      `[email] Transactional SMTP ready (host=${host}, port=${port}, user=${user}, from=${from || user})`,
    );
    return;
  }
  const missing = getMissingSmtpEnvKeys();
  console.warn(
    `[email] Welcome & tutor emails are disabled — add to backend/.env: ${missing.join(", ")}. ` +
      `See backend/.env.example.`,
  );
}

const createTransporter = () => {
  if (!isConfigured()) {
    return null;
  }
  const { host, port, user, pass } = getConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

/**
 * Get first name from full name (first word) or fallback to full name.
 * @param {{ name?: string, email: string }} user
 * @returns {string}
 */
function getFirstName(user) {
  const name = (user && user.name) ? String(user.name).trim() : '';
  if (!name) return 'there';
  const first = name.split(/\s+/)[0];
  return first || 'there';
}

/**
 * Platform base URL from env.
 * @returns {string}
 */
function getPlatformUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/**
 * Send welcome email to a newly registered user.
 * Does not throw; logs errors. Call without await to avoid blocking the request.
 *
 * @param {{ name?: string, email: string }} user - User object with at least email
 * @returns {Promise<void>}
 */
export async function sendWelcomeEmail(user) {
  if (!user || !user.email) {
    console.warn('emailService.sendWelcomeEmail: missing user or email');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(
      `emailService: skipping welcome email (SMTP incomplete: ${getMissingSmtpEnvKeys().join(", ")})`,
    );
    return;
  }

  const firstName = getFirstName(user);
  const platformUrl = getPlatformUrl();
  const from = getConfig().from;

  const mailOptions = {
    from: from,
    to: user.email,
    subject: "You're in! Your learning journey starts here 🚀",
    text: `Hey ${firstName}!

You're officially part of Best Choice Tutors — and we couldn't be happier!

This is where learners like you find expert tutors, book sessions that fit their schedule, and actually see real progress. No more endless searching or one-size-fits-all classes.

Jump in and:

✨ Browse vetted tutors in the subjects you care about
✨ Book your first session (and get 20% off — yes, really!)
✨ Track your progress and stay on top of your goals
✨ Message tutors directly and build a learning plan together

Your next step? Pick a tutor and book that first session. We've made it simple.

👉 Start exploring: ${platformUrl}

We're here to help if you need anything. Let's make this year your best learning year yet!

— The Best Choice Tutors Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="font-size: 18px; color: #1a1a1a;">Hey ${firstName}!</p>
        <p style="font-size: 18px; color: #1a1a1a; line-height: 1.5;"><strong>You're officially part of Best Choice Tutors</strong> — and we couldn't be happier! 🎉</p>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">This is where learners like you find expert tutors, book sessions that fit their schedule, and actually see <strong>real progress</strong>. No more endless searching or one-size-fits-all classes.</p>
        <p style="font-size: 16px; color: #1a1a1a;"><strong>Jump in and:</strong></p>
        <ul style="font-size: 15px; color: #444; line-height: 1.8;">
          <li>✨ Browse vetted tutors in the subjects you care about</li>
          <li>✨ Book your first session <span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px;"><strong>20% off — yes, really!</strong></span></li>
          <li>✨ Track your progress and stay on top of your goals</li>
          <li>✨ Message tutors directly and build a learning plan together</li>
        </ul>
        <p style="font-size: 16px; color: #1a1a1a;"><strong>Your next step?</strong> Pick a tutor and book that first session. We've made it simple.</p>
        <p style="margin: 24px 0 16px;">
          <a href="${platformUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">👉 Start exploring tutors</a>
        </p>
        <p style="font-size: 15px; color: #666;">We're here to help if you need anything. Let's make this year your best learning year yet!</p>
        <p style="font-size: 14px; color: #888; margin-top: 32px;">— The Best Choice Tutors Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('emailService.sendWelcomeEmail failed:', err?.message || err);
  }
}

/**
 * Send congratulations email when a learner becomes a tutor (tutor profile created).
 * Does not throw; logs errors. Call without await to avoid blocking the request.
 *
 * @param {{ name?: string, email: string }} user - User object with at least email
 * @returns {Promise<void>}
 */
export async function sendTutorUpgradeEmail(user) {
  if (!user || !user.email) {
    console.warn('emailService.sendTutorUpgradeEmail: missing user or email');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(
      `emailService: skipping tutor upgrade email (SMTP incomplete: ${getMissingSmtpEnvKeys().join(", ")})`,
    );
    return;
  }

  const firstName = getFirstName(user);
  const dashboardUrl = `${getPlatformUrl()}/tutor/dashboard`;
  const from = getConfig().from;

  const mailOptions = {
    from: from,
    to: user.email,
    subject: "You're live! Start teaching & earning on Best Choice Tutors 🎉",
    text: `Hey ${firstName}!

Big news — your tutor profile is live on Best Choice Tutors!

You're not just another profile. You're part of a community where learners are actively looking for experts like you. Here's what just unlocked:

• Get booking requests from learners who want to learn from you
• Manage your calendar, sessions, and earnings in one place
• Earn real income doing what you're great at
• Build reviews and a reputation that brings more students

To get the most out of it:

1. Fill in your availability so learners can book you
2. Add your subjects and experience so you show up in the right searches
3. Check your dashboard and respond to requests — learners are waiting!

Open your tutor dashboard and get started:
${dashboardUrl}

We're pumped to have you. Go make an impact!

— The Best Choice Tutors Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="font-size: 18px; color: #1a1a1a;">Hey ${firstName}!</p>
        <p style="font-size: 18px; color: #1a1a1a; line-height: 1.5;"><strong>Big news</strong> — your tutor profile is live on Best Choice Tutors! 🎉</p>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">You're not just another profile. You're part of a community where learners are actively looking for experts like you.</p>
        <p style="font-size: 16px; color: #1a1a1a;"><strong>Here's what just unlocked:</strong></p>
        <ul style="font-size: 15px; color: #444; line-height: 1.8;">
          <li>Get booking requests from learners who want to learn from you</li>
          <li>Manage your calendar, sessions, and earnings in one place</li>
          <li>Earn real income doing what you're great at</li>
          <li>Build reviews and a reputation that brings more students</li>
        </ul>
        <p style="font-size: 16px; color: #1a1a1a;"><strong>To get the most out of it:</strong></p>
        <ol style="font-size: 15px; color: #444; line-height: 1.8;">
          <li>Fill in your availability so learners can book you</li>
          <li>Add your subjects and experience so you show up in the right searches</li>
          <li>Check your dashboard and respond to requests — learners are waiting!</li>
        </ol>
        <p style="margin: 24px 0 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">Open my dashboard →</a>
        </p>
        <p style="font-size: 15px; color: #666;">We're pumped to have you. Go make an impact!</p>
        <p style="font-size: 14px; color: #888; margin-top: 32px;">— The Best Choice Tutors Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('emailService.sendTutorUpgradeEmail failed:', err?.message || err);
  }
}

/**
 * Notify tutor that admin has approved their identity (profile) verification.
 * Does not throw; logs errors.
 *
 * @param {{ name?: string, email: string }} user
 * @returns {Promise<void>}
 */
export async function sendIdentityVerificationApprovedEmail(user) {
  if (!user || !user.email) {
    console.warn('emailService.sendIdentityVerificationApprovedEmail: missing user or email');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(
      `emailService: skipping identity verification email (SMTP incomplete: ${getMissingSmtpEnvKeys().join(", ")})`,
    );
    return;
  }

  const firstName = getFirstName(user);
  const dashboardUrl = `${getPlatformUrl()}/tutor/dashboard`;
  const from = getConfig().from;

  const mailOptions = {
    from,
    to: user.email,
    subject: "Your identity verification is complete — Best Choice Tutors",
    text: `Hey ${firstName}!

Great news — we've reviewed and approved your identity verification on Best Choice Tutors.

You're now shown to learners as an identity-verified tutor. That helps build trust and can improve how you appear in search and on your profile.

Next steps:
• Keep your profile and availability up to date
• Respond promptly to booking requests
• Complete any remaining checks (such as DBS) if you haven't already

Open your tutor dashboard:
${dashboardUrl}

Thanks for working with us.

— The Best Choice Tutors Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="font-size: 18px; color: #1a1a1a;">Hey ${firstName}!</p>
        <p style="font-size: 18px; color: #1a1a1a; line-height: 1.5;"><strong>Great news</strong> — we've reviewed and approved your <strong>identity verification</strong> on Best Choice Tutors.</p>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">You're now shown to learners as an identity-verified tutor. That helps build trust and can improve how you appear in search and on your profile.</p>
        <p style="font-size: 16px; color: #1a1a1a;"><strong>Next steps:</strong></p>
        <ul style="font-size: 15px; color: #444; line-height: 1.8;">
          <li>Keep your profile and availability up to date</li>
          <li>Respond promptly to booking requests</li>
          <li>Complete any remaining checks (such as DBS) if you haven't already</li>
        </ul>
        <p style="margin: 24px 0 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">Open my dashboard →</a>
        </p>
        <p style="font-size: 15px; color: #666;">Thanks for working with us.</p>
        <p style="font-size: 14px; color: #888; margin-top: 32px;">— The Best Choice Tutors Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('emailService.sendIdentityVerificationApprovedEmail failed:', err?.message || err);
  }
}

/**
 * Notify tutor that admin has approved their DBS verification.
 * Does not throw; logs errors.
 *
 * @param {{ name?: string, email: string }} user
 * @returns {Promise<void>}
 */
export async function sendDbsVerificationApprovedEmail(user) {
  if (!user || !user.email) {
    console.warn('emailService.sendDbsVerificationApprovedEmail: missing user or email');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(
      `emailService: skipping DBS verification email (SMTP incomplete: ${getMissingSmtpEnvKeys().join(", ")})`,
    );
    return;
  }

  const firstName = getFirstName(user);
  const dashboardUrl = `${getPlatformUrl()}/tutor/dashboard`;
  const from = getConfig().from;

  const mailOptions = {
    from,
    to: user.email,
    subject: "Your DBS verification is complete — Best Choice Tutors",
    text: `Hey ${firstName}!

We've approved your DBS (Disclosure and Barring Service) submission on Best Choice Tutors.

Your profile now reflects DBS verification, which helps families and learners see that you've completed this important safeguard.

You can review your profile and bookings anytime:
${dashboardUrl}

Thank you for keeping our community safe and trusted.

— The Best Choice Tutors Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="font-size: 18px; color: #1a1a1a;">Hey ${firstName}!</p>
        <p style="font-size: 18px; color: #1a1a1a; line-height: 1.5;">We've approved your <strong>DBS (Disclosure and Barring Service)</strong> submission on Best Choice Tutors.</p>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">Your profile now reflects DBS verification, which helps families and learners see that you've completed this important safeguard.</p>
        <p style="margin: 24px 0 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white !important; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">Open my dashboard →</a>
        </p>
        <p style="font-size: 15px; color: #666;">Thank you for keeping our community safe and trusted.</p>
        <p style="font-size: 14px; color: #888; margin-top: 32px;">— The Best Choice Tutors Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('emailService.sendDbsVerificationApprovedEmail failed:', err?.message || err);
  }
}
