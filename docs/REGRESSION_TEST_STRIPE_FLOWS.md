# Regression Test: Stripe Payment & Earnings Flows

Use this checklist to verify all Stripe-related flows after changes. Code references point to the source of truth.

---

## 1. Booking creation

**Flow:** Learner creates a booking for a slot → status PENDING, no payment IDs yet.

| Check | Location | Expected |
|-------|----------|----------|
| POST /api/bookings creates booking | `bookingController.createBooking` → `bookingService.createBookingForSlot` | 201, booking.status = PENDING |
| One booking per slot (PENDING/PAID) | `bookingService.createBookingForSlot` + unique index `Booking` | 409 if slot taken |
| agreedHourlyRate set (tutor rate or request budget) | `bookingService.createBookingForSlot` | booking.agreedHourlyRate present |
| Response does not include razorpayOrderId | `bookingController.createBooking` | No razorpay fields in response |

**Manual:** As Learner, open a tutor profile → pick slot → Book Session → confirm age → create booking. Verify booking appears with status PENDING before payment.

---

## 2. Payment success

**Flow:** Learner pays → Stripe Checkout → webhook marks booking PAID.

| Check | Location | Expected |
|-------|----------|----------|
| POST /api/bookings/:id/pay creates Stripe Checkout Session | `bookingController.payForBooking` → `bookingService.createPaymentOrderForBooking` → `stripeService.createCheckoutSession` | 200, checkoutUrl, booking.stripeSessionId & stripePaymentIntentId stored |
| Amount = agreedHourlyRate × duration (same logic as before) | `getBookingAmountInPaiseFromBooking` / `getBookingAmountInPaise` in `createPaymentOrderForBooking` | amount in paise, currency gbp |
| Webhook checkout.session.completed → PAID | `webhookController.handleStripeWebhook` → `updateBookingStatusFromStripeCheckoutSession` → `handleBookingPaid` | Booking status PAID, stripePaymentIntentId set |
| Webhook payment_intent.succeeded → PAID (alternative path) | Same handler → `updateBookingStatusFromStripePaymentIntent` → `handleBookingPaid` | Same as above; idempotent if both events fire |
| Frontend does not mark paid | `TutorProfile.jsx`: redirect to checkoutUrl only, no status API on success | Payment state from webhook only |

**Manual:** Create booking → click pay → complete Stripe Checkout (test card 4242…). Return to app. Refresh My Bookings → booking should show PAID (after webhook). Or use DEV override below.

**DEV override (no Stripe):** PATCH /api/bookings/:id/test-payment-status with body `{ "status": "PAID" }` (non-production only). Calls `handleBookingPaid(booking, {})` so earnings are created.

---

## 3. Payment failure

**Flow:** Payment fails at Stripe → webhook marks booking FAILED.

| Check | Location | Expected |
|-------|----------|----------|
| Webhook payment_intent.payment_failed → FAILED | `handleStripeWebhook` → `updateBookingStatusFromStripePaymentIntent` with targetStatus FAILED | Booking status FAILED |
| Only PENDING → FAILED (no overwrite of PAID) | `bookingService.updateBookingStatusFromStripePaymentIntent`: `if (booking.status === 'PENDING')` before `handleBookingFailed` | PAID unchanged if events reordered |
| No TutorEarnings on failure | `handleBookingFailed` only sets status; no earnings creation | No ledger entry for this booking |

**Manual:** Use Stripe test card that fails, or DEV override: PATCH test-payment-status with `{ "status": "FAILED" }`. Booking should be FAILED, no earnings.

---

## 4. Earnings creation

**Flow:** When booking becomes PAID, one TutorEarnings row (pendingRelease) is created.

| Check | Location | Expected |
|-------|----------|----------|
| handleBookingPaid creates TutorEarnings | `bookingService.handleBookingPaid`: `TutorEarnings.findOneAndUpdate` with $setOnInsert | status pendingRelease, amount = booking amount, commissionInPaise from PlatformConfig |
| Commission = amount × commissionRate / 100 | Same block: `PlatformConfig.findOne()`, `commissionRate`, `Math.round((amountInPaise * commissionRate) / 100)` | commissionInPaise stored |
| Idempotent: duplicate webhook does not double-credit | Same: if `booking.status === 'PAID'` already, only ensures earnings exist via $setOnInsert | Single row per booking |
| TuitionRequest closed when request-based booking | `handleBookingPaid`: TuitionRequest.updateOne status CLOSED | tuitionRequestId booking → request CLOSED |
| Financial audit EARNINGS_CREATED | `logFinancialAudit({ action: 'EARNINGS_CREATED', ... })` | Entry in FinancialAuditLog |

**Manual:** After a PAID booking, check DB or admin: TutorEarnings for that bookingId, status pendingRelease, amount and commissionInPaise set.

---

## 5. Completion release

**Flow:** After session end + buffer, PAID → COMPLETED and pendingRelease → available; then transfer.

| Check | Location | Expected |
|-------|----------|----------|
| Cron completes eligible bookings | `index.js` runs `completeEligibleBookings` periodically | PAID bookings past sessionEnd+buffer → COMPLETED |
| Session end + buffer = date+endTime + 15 min | `bookingService.getSessionEndPlusBuffer`, COMPLETION_BUFFER_MINUTES = 15 | No completion before buffer |
| Open dispute blocks completion | `completeEligibleBookings`: Dispute.findOne OPEN → continue | Booking stays PAID, no release |
| releaseWalletForBookingInternal: pendingRelease → available | TutorEarnings.updateOne status 'available' | One row updated |
| EARNINGS_RELEASED audit | `logFinancialAudit({ action: 'EARNINGS_RELEASED', ... })` | Logged |
| Transfer triggered after release | `ensureTransferForEarnings(bookingId, netAmount)` with net = amount - commissionInPaise | See Transfer section |

**Manual:** Create PAID booking with session in the past (or mock time). Wait for cron or trigger once. Booking → COMPLETED, TutorEarnings status → available.

---

## 6. Dispute full refund

**Flow:** Admin resolves dispute with FULL_REFUND → learner refunded, tutor earnings refunded, transfer reversed if already sent.

| Check | Location | Expected |
|-------|----------|----------|
| Stripe refund to learner | `disputeService.resolveDispute`: `createRefund({ paymentIntentId })` (stripeService) | Refund created |
| Transfer reversal if transfer existed | `if (walletEntry.stripeTransferId) createTransferReversal(walletEntry.stripeTransferId)` | Reversal before marking refunded |
| TutorEarnings → refunded | `markTutorEarningsRefunded(dispute.bookingId)` | status in [pendingRelease, available] → refunded |
| REFUND_FULL audit | `logFinancialAudit({ action: 'REFUND_FULL', ... })` | Logged |

**Manual:** As admin, open a dispute for a COMPLETED booking (or one that had transfer). Resolve with FULL_REFUND. Verify Stripe refund + optional reversal; TutorEarnings status refunded; FinancialAuditLog.

---

## 7. Dispute partial refund

**Flow:** Admin resolves with PARTIAL_REFUND → partial Stripe refund, remainder released to tutor and transferred.

| Check | Location | Expected |
|-------|----------|----------|
| Stripe partial refund | `createRefund({ paymentIntentId, amount: refundAmountInPaise })` | Refund amount to learner |
| releasePartialToTutor: amount = net, status = available | TutorEarnings.updateOne amount = netAmountInPaise, status = 'available' | One row updated |
| ensureTransferForEarnings(bookingId, netAmountInPaise) | Called after releasePartialToTutor | Transfer for net amount only |
| REFUND_PARTIAL + EARNINGS_RELEASED audit | logFinancialAudit for both | Both logged |

**Manual:** Resolve dispute with PARTIAL_REFUND and refundAmountInPaise. Learner refunded that amount; TutorEarnings amount = original - refund, status available; transfer for net.

---

## 8. Tutor Connect onboarding

**Flow:** Tutor clicks “Complete Payout Setup” → redirect to Stripe → account.updated webhook updates tutor.

| Check | Location | Expected |
|-------|----------|----------|
| POST /api/tutor/payout-setup returns onboardingUrl | `tutorController.createPayoutSetupLink` → `stripeConnectService.createPayoutOnboardingLink` | 200, onboardingUrl |
| One account per tutor (idempotent) | `getOrCreateStripeAccountForTutor`: if tutor.stripeAccountId return it; else create + save | No duplicate Stripe accounts |
| Account Link type account_onboarding | `stripeService.createAccountLink` | Redirect to Stripe hosted onboarding |
| Webhook account.updated updates Tutor | `handleStripeWebhook` → `updateTutorFromStripeAccount` | chargesEnabled, payoutsEnabled, stripeOnboardingStatus (COMPLETED when both true) |
| lastOnboardingError cleared when COMPLETED | `stripeConnectService.updateTutorFromStripeAccount` | lastOnboardingError = null |

**Manual:** As Tutor, My Profile → Payout Details → Complete Payout Setup. Redirect to Stripe; complete onboarding. Return; webhook should update tutor (or refresh profile). Status COMPLETED, chargesEnabled/payoutsEnabled true.

---

## 9. Transfer after completion

**Flow:** When TutorEarnings moves to available, Stripe transfer to tutor.stripeAccountId if payoutsEnabled.

| Check | Location | Expected |
|-------|----------|----------|
| ensureTransferForEarnings called from releaseWalletForBookingInternal | After TutorEarnings update to available, netAmount = entry.amount - commissionInPaise | createTransfer(amount, currency gbp, destination tutor.stripeAccountId) |
| ensureTransferForEarnings called from releasePartialToTutor | After partial release with netAmountInPaise | Same, amount = net |
| stripeTransferId saved on TutorEarnings | TutorEarnings.updateOne { stripeTransferId: transfer.id } | One transfer per booking stored |
| Skipped if tutor not payouts-enabled | ensureTransferForEarnings: !tutor.payoutsEnabled or !tutor.stripeAccountId → return false, log | No transfer; release still succeeded |

**Manual:** Ensure tutor has payoutsEnabled (Stripe Connect onboarding done). Complete a booking through to available. Check TutorEarnings has stripeTransferId; Stripe Dashboard shows transfer.

---

## 10. No double transfers

**Flow:** Multiple calls for same booking must not create duplicate transfers.

| Check | Location | Expected |
|-------|----------|----------|
| Idempotency guard | `ensureTransferForEarnings`: `const entry = TutorEarnings.findOne({ bookingId, status: 'available' }); if (entry.stripeTransferId) return false` | Second call does nothing |
| stripeTransferId set immediately after createTransfer | updateOne { stripeTransferId: transfer.id } | Any retry sees stripeTransferId and skips |

**Manual:** Trigger release twice for same booking (e.g. RELEASE_PAYMENT_TO_TUTOR twice or cron run twice). Only one Stripe transfer and one stripeTransferId.

---

## 11. Admin financial overview correct

**Flow:** GET /api/admin/financials aggregates TutorEarnings only; no Razorpay.

| Check | Location | Expected |
|-------|----------|----------|
| totalPayments = sum of all TutorEarnings.amount | `adminController.getFinancials`: TutorEarnings.aggregate $sum "$amount" | Total of all earnings |
| totalEscrow = sum where status pendingRelease | Match status "pendingRelease", $sum "$amount" | Pending release total |
| totalPaidOut = sum where status available | Match status "available", $sum "$amount" | Available total |
| totalRefunded = sum where status refunded | Match status "refunded", $sum "$amount" | Refunded total |
| activeDisputesCount = OPEN disputes | Dispute.countDocuments({ status: "OPEN" }) | Count OPEN |
| No Razorpay / Stripe API calls in getFinancials | getFinancials body | Read-only from DB |

**Manual:** As Admin, open financials page. Compare totals with DB aggregates on TutorEarnings and Dispute.

---

## Quick DEV test sequence (no real Stripe)

1. **Booking creation:** POST /api/bookings (Learner auth), body with tutorId, date, startTime, endTime → 201, booking PENDING.
2. **Payment success (override):** PATCH /api/bookings/:id/test-payment-status (Learner auth), body `{ "status": "PAID" }` → 200, booking PAID. Check TutorEarnings created (pendingRelease).
3. **Completion:** Either wait for cron or temporarily set booking date/endTime in past and run completion job once. Booking COMPLETED, TutorEarnings available. (Transfer will run only if tutor has payoutsEnabled.)
4. **Financials:** GET /api/admin/financials (Admin auth) → totalPayments includes new booking amount; totalEscrow or totalPaidOut updated as expected.
5. **Payment failure (override):** New PENDING booking → PATCH test-payment-status `{ "status": "FAILED" }` → booking FAILED, no TutorEarnings.

---

## Environment

- Backend: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET for payments and webhooks.
- Frontend: No Stripe key needed for redirect flow (checkout URL from backend).
- Stripe Dashboard: Configure webhook endpoint POST /api/webhooks/stripe for events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, account.updated.
