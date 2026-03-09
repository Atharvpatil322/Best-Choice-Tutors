/**
 * E2E verification: Phase 11 – Cancellation & refund policy wiring
 *
 * Lightweight smoke tests to ensure:
 * - bookingService exports cancelBooking
 * - Terms page contains the updated simplified refund policy text
 *
 * Run from repo root:
 *   node --test tests/e2e-verification/phase-11-cancellation-refund-policy.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

describe('Phase 11: Cancellation & refund policy', () => {
  it('bookingService exports cancelBooking function', async () => {
    const bookingService = await import('../../backend/services/bookingService.js');
    assert.strictEqual(
      typeof bookingService.cancelBooking,
      'function',
      'bookingService.cancelBooking should be a function'
    );
  });

  it('Terms page includes simplified refund & cancellation policy text', () => {
    const termsPath = path.join(
      repoRoot,
      'frontend',
      'src',
      'pages',
      'Terms.jsx'
    );
    const contents = fs.readFileSync(termsPath, 'utf8');

    // Basic assertions against the key policy text we added
    assert.match(
      contents,
      /Refund &amp; cancellation policy/,
      'Terms.jsx should contain a "Refund & cancellation policy" section heading'
    );
    assert.match(
      contents,
      /Learner cancels 24\+ hours before the session.*75% refund/i,
      'Terms.jsx should mention 75% refund for learner cancellations 24+ hours before the session'
    );
    assert.match(
      contents,
      /Learner cancels within 24 hours of the session.*No refund/i,
      'Terms.jsx should mention no refund within 24 hours'
    );
    assert.match(
      contents,
      /Tutor cancels.*100% refund to the learner/i,
      'Terms.jsx should mention 100% refund when tutor cancels'
    );
  });
});

