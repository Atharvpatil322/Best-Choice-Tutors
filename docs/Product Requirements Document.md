# Product Requirements Document (PRD)

**Product Name:** Tutoring Marketplace Platform
**Version:** 1.0
**Date:** January 25, 2026
**Status:** Draft

---

## 1. Product Vision

A centralized digital marketplace that creates trusted connections between learners (students and parents) and qualified tutors, enabling seamless discovery, booking, and payment for tutoring services.

---

## 2. Product Goals

| Goal | Success Indicator |
|------|-------------------|
| Simplify tutor discovery | Users can find relevant tutors within minutes |
| Build trust in the ecosystem | High percentage of verified tutors with visible ratings |
| Enable frictionless transactions | Bookings completed without off-platform coordination |
| Empower independent tutors | Tutors gain visibility without marketing overhead |
| Generate sustainable revenue | Consistent commission-based income from bookings |

---

## 3. Target Users

### Primary Users

**Learners (Students & Parents)**
- Seeking academic support across various subjects
- Need verified, trustworthy tutors
- Value convenience in scheduling and payments

**Tutors**
- Independent educators offering online or in-person sessions
- Seeking visibility and consistent booking flow
- Want to reduce administrative burden

### Secondary Users

**Platform Administrators**
- Manage quality control and verification
- Handle disputes and financial operations
- Monitor platform health and compliance

---

## 4. Product Scope

### In Scope (MVP)

- User registration and authentication
- Tutor profiles with qualification verification
- Learner profiles with booking history
- Tutor search and discovery (filters, map view)
- Session booking and scheduling
- Secure payment processing with escrow
- In-platform messaging (post-booking)
- Reviews and ratings
- Admin panel for verification and oversight

### Out of Scope (Future Considerations)

- Mobile native applications
- Video conferencing integration
- AI-powered tutor matching
- Group tutoring sessions
- Subscription-based tutoring packages
- Multi-language support
- Tutor certification courses
- Integration with school systems

---

## 5. High-Level User Journeys

### Journey 1: Learner Finds and Books a Tutor

1. Learner visits the platform and browses available tutors
2. Learner searches/filters by subject, price, rating, or location
3. Learner views tutor profile (bio, qualifications, reviews, verified badge)
4. Learner selects available time slot from tutor's calendar
5. Learner completes payment to confirm booking
6. Both parties receive confirmation and can message each other
7. Session occurs (online or in-person with check-in)
8. Learner marks session complete and leaves a review

### Journey 2: Tutor Joins and Gets Verified

1. User registers as a learner (default role)
2. User initiates "Become a Tutor" flow
3. User completes tutor profile (subjects, rates, availability, bio)
4. User uploads qualification documents
5. Admin reviews and approves documents
6. Tutor profile goes live with "Verified" badge
7. Tutor appears in search results and receives booking requests

### Journey 3: Learner Posts a Tuition Request (Reverse Discovery)

1. Learner creates a tuition request (subject, budget, preferred mode)
2. Request becomes visible to verified tutors
3. Interested tutors express interest
4. Learner reviews interested tutors and initiates conversation
5. Learner books preferred tutor through standard flow

### Journey 4: Dispute Resolution

1. Session occurs but learner is dissatisfied
2. Learner raises dispute within 24-hour window
3. Funds remain in escrow (payment paused)
4. Admin reviews evidence from both parties
5. Admin resolves: full refund, partial refund, or payment release
6. Both parties notified of resolution

---

## 6. Key Product Principles

### Trust First
- Verification is mandatory for tutors to appear in search
- Reviews cannot be deleted by tutors
- Payment is secured before session confirmation

### Platform Integrity
- All bookings and payments must occur on-platform
- Off-platform communication is discouraged and flagged
- Chat enabled only after payment or expressed interest

### User Safety
- Personal contact details are masked
- Conversations are monitored for policy violations
- Dispute mechanisms protect both parties

### Transparency
- Clear pricing with no hidden fees
- Visible commission structure
- Users informed about platform monitoring policies

---

## 7. MVP vs Future Phases

### MVP (Phase 1)
| Capability | Description |
|------------|-------------|
| Core Authentication | Email/password and social sign-in |
| Tutor Discovery | Search, filters, profile viewing |
| Booking Flow | Calendar selection, single and recurring sessions |
| Payment Processing | Upfront payment, escrow, commission deduction |
| Basic Messaging | Post-booking chat |
| Reviews | Post-session ratings and text feedback |
| Admin Essentials | Verification queue, user management, basic dashboard |

### Future Enhancements (Post-MVP)
| Capability | Rationale |
|------------|-----------|
| Advanced Matching | AI-driven tutor recommendations based on learning goals |
| Video Integration | Native video sessions eliminate third-party tool dependency |
| Mobile Apps | Improved accessibility and engagement |
| Subscription Plans | Predictable revenue for tutors, discounts for learners |
| Analytics for Tutors | Help tutors optimize profiles and availability |
| Group Sessions | Expand service offerings and affordability |
| Multi-currency Support | Enable geographic expansion |

---

## 8. Constraints & Dependencies

### Constraints
- Initial launch limited to UK market
- Platform requires active internet connection
- All transactions must occur on-platform (no off-platform workarounds)

### Dependencies
- Third-party payment gateway for financial transactions
- Map service provider for location-based discovery
- Email service for notifications
- Cloud storage for document uploads

---

## 9. Success Metrics

| Metric | MVP Target |
|--------|------------|
| Registered Tutors | Baseline to be established |
| Verified Tutor Rate | >80% of registered tutors |
| Booking Conversion | Measurable from search to completed booking |
| Repeat Booking Rate | Indicator of user satisfaction |
| Average Tutor Rating | Platform quality benchmark |
| Dispute Rate | <5% of completed sessions |
| Platform Revenue | Commission from successful bookings |

---

## 10. Cancellation & Refund Policy

### 10.1 Policy Principles

- Protect learners from tutor no-shows and poor service
- Protect tutors from last-minute cancellations that waste their time
- Ensure platform commission is only collected on completed sessions
- Automate refund processing through escrow integration

### 10.2 Learner-Initiated Cancellations

| Cancellation Timing | Refund Amount | Tutor Compensation | Platform Commission |
|---------------------|---------------|-------------------|---------------------|
| 24+ hours before session | 100% refund | None | None |
| 12-24 hours before session | 75% refund | 25% of session fee | None |
| 2-12 hours before session | 50% refund | 50% of session fee | None |
| Less than 2 hours before session | No refund | 100% of session fee | Standard commission applies |
| No-show (learner fails to attend) | No refund | 100% of session fee | Standard commission applies |

### 10.3 Tutor-Initiated Cancellations

| Cancellation Timing | Learner Outcome | Tutor Impact |
|---------------------|-----------------|--------------|
| Any time before session | 100% refund | Cancellation recorded on profile |
| No-show (tutor fails to attend) | 100% refund | Strike recorded; 3 strikes trigger review |

### 10.4 Pending Booking Cancellations

- Bookings not yet accepted by tutor: Full refund, no penalty to either party
- Bookings accepted but not yet paid: No financial transaction to reverse

### 10.5 Dispute-Related Refunds

- Handled separately through dispute resolution flow
- Admin determines refund amount based on evidence
- Options: Full refund, partial refund, or payment release to tutor

---

## 11. Tutor Wallet & Withdrawal Model

### 11.1 Wallet Architecture

The tutor wallet is an internal ledger tracking earnings through three states:

| Balance State | Description |
|---------------|-------------|
| **Pending** | Funds in escrow; session not yet completed |
| **Available** | Session completed + 24-hour hold passed; eligible for withdrawal |
| **Withdrawn** | Funds transferred to tutor's bank account |

### 11.2 Earnings Flow

1. Learner pays for booking → Funds enter escrow (Pending)
2. Session completes (manual or auto-confirmed after 24 hours)
3. 24-hour dispute window passes without dispute
4. Platform commission deducted → Net amount moves to Available balance
5. Tutor requests withdrawal → Funds move to Withdrawn after processing

### 11.3 Withdrawal Rules

| Rule | Specification |
|------|---------------|
| Minimum withdrawal amount | £20 |
| Payout processing frequency | Weekly (every Monday) |
| Payout method | Bank transfer (UK accounts) |
| Processing time | 2-3 business days after payout run |
| Withdrawal request deadline | Sunday 11:59 PM for Monday payout |

### 11.4 Compliance Requirements

- Tutors must provide valid UK bank account details
- Tutors must accept Independent Contractor Agreement
- Platform will issue annual earnings statements for tax purposes
- Tutors are responsible for their own tax obligations (self-assessment)

---

## 12. Legal, Compliance & Regulatory Requirements

### 12.1 Data Protection (UK GDPR)

| Requirement | Implementation |
|-------------|----------------|
| Lawful basis for processing | Consent (registration) and Contract (service delivery) |
| Data minimization | Collect only data necessary for platform operation |
| Storage limitation | Define retention periods for all data categories |
| Security | Encryption at rest and in transit; access controls |
| Breach notification | Process to notify ICO within 72 hours if required |

### 12.2 User Data Rights

The platform must support user requests for:

| Right | Response Timeframe |
|-------|-------------------|
| Access (Subject Access Request) | Within 30 days |
| Rectification | Within 30 days |
| Erasure ("Right to be forgotten") | Within 30 days, subject to legal retention requirements |
| Data portability | Within 30 days |
| Objection to processing | Immediate cessation where applicable |

### 12.3 Data Retention Policy

| Data Category | Retention Period | Justification |
|---------------|------------------|---------------|
| User account data | Duration of account + 2 years | Service delivery and re-activation |
| Booking records | 7 years from transaction | UK tax and financial regulations |
| Payment records | 7 years from transaction | UK tax and financial regulations |
| Chat messages | 2 years from last message | Dispute resolution and safety |
| Tutor verification documents | Duration of account + 1 year | Verification audit trail |
| Audit logs | 7 years | Compliance and legal requirements |
| Deleted account data | Anonymized immediately, financial records retained 7 years | GDPR compliance balanced with legal obligations |

### 12.4 Handling of Minors

| Requirement | Implementation |
|-------------|----------------|
| Age verification | Users must confirm they are 18+ OR have parental consent |
| Parental consent | Under-18 learners require linked parent/guardian account |
| Parent account controls | Parents can view bookings, messages, and payment history |
| Tutor interactions | All sessions involving minors must follow safeguarding guidelines |
| DBS checks | Tutors working with minors encouraged to upload DBS certificate |

### 12.5 Tutor Classification

Tutors on the platform are classified as **Independent Contractors**, not employees:

| Characteristic | Platform Approach |
|----------------|-------------------|
| Control over work | Tutors set own rates, availability, and teaching methods |
| Financial risk | Tutors bear risk of cancellations and client acquisition |
| Equipment | Tutors provide own teaching materials and equipment |
| Exclusivity | No exclusivity requirement; tutors may use other platforms |
| Tax responsibility | Tutors responsible for own tax registration and payments |

Tutors must acknowledge this classification during onboarding by accepting the Independent Contractor Agreement.

### 12.6 Financial Compliance

| Requirement | Implementation |
|-------------|----------------|
| PCI DSS | Payment processing delegated to PCI-compliant gateway (Stripe) |
| Anti-money laundering | Transaction monitoring for suspicious patterns |
| Consumer protection | Clear pricing, refund policy, and terms of service |
| Platform liability | Terms of service define platform as intermediary, not party to tutoring contract |

---

## 13. Open Questions & Decisions Needed

| Question | Status |
|----------|--------|
| Commission percentage to charge | To be finalized (recommended: 15-20%) |
| Geographic expansion timeline | Post-MVP planning |
| Subscription model structure | Future consideration |
| DBS check requirement (mandatory vs optional) | To be finalized |
| Minimum tutor age | To be finalized (recommended: 18+) |

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 25, 2026 | Product Team | Initial PRD based on BRD v1.0 and FRD v1.1 |
| 1.1 | Jan 25, 2026 | Product Team | Added Cancellation & Refund Policy (Section 10), Tutor Wallet & Withdrawal Model (Section 11), Legal & Compliance Requirements (Section 12) |

---

*This document should be reviewed and updated as product decisions are made and user feedback is gathered.*
