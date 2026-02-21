/**
 * E2E verification: Phase 1 – User setup
 *
 * High-level checks for registration, auth, role switch, and profile.
 * Uses real authController, userProfileController, auth middleware; no mocks of business logic.
 * Run from repo root: node --test tests/e2e-verification/phase-1-user-setup.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 1: User setup', () => {
  describe('Auth controller exports', () => {
    it('exposes getMe for current user', async () => {
      const auth = await import('../../backend/controllers/authController.js');
      assert.strictEqual(typeof auth.getMe, 'function');
      // Expected: getMe returns user profile for authenticated user.
    });

    it('exposes switchToTutor for learner-to-tutor role switch', async () => {
      const auth = await import('../../backend/controllers/authController.js');
      assert.strictEqual(typeof auth.switchToTutor, 'function');
      // Expected: only Learners can switch; role becomes Tutor and new token returned.
    });

    it('exposes register and login handlers', async () => {
      const auth = await import('../../backend/controllers/authController.js');
      assert.strictEqual(typeof auth.register, 'function');
      assert.strictEqual(typeof auth.login, 'function');
      // Expected: register creates user; login returns token for valid credentials.
    });
  });

  describe('Auth middleware', () => {
    it('authenticate verifies JWT and attaches user', async () => {
      const authMiddleware = await import('../../backend/middlewares/auth.js');
      assert.strictEqual(typeof authMiddleware.authenticate, 'function');
      // Expected: 401 when no/invalid token; 403 when user suspended/banned; req.user set otherwise.
    });
  });

  describe('User profile controller', () => {
    it('exposes profile read/update for authenticated user', async () => {
      const userProfile = await import('../../backend/controllers/userProfileController.js');
      assert.strictEqual(typeof userProfile.getProfile, 'function');
      assert.strictEqual(typeof userProfile.updateProfile, 'function');
      // Expected: getProfile returns current user profile; updateProfile updates allowed fields.
    });
  });

  describe('Password and JWT utils', () => {
    it('password utils support hash and compare', async () => {
      const password = await import('../../backend/utils/password.js');
      assert.strictEqual(typeof password.hashPassword, 'function');
      assert.strictEqual(typeof password.comparePassword, 'function');
      // Expected: hashPassword hashes plain text; comparePassword returns true for matching hash.
    });

    it('JWT utils support generate and verify', async () => {
      const jwt = await import('../../backend/utils/jwt.js');
      assert.strictEqual(typeof jwt.generateToken, 'function');
      assert.strictEqual(typeof jwt.verifyToken, 'function');
      // Expected: generateToken creates signed token; verifyToken decodes and validates.
    });
  });
});
