# High-Level Product Backlog

**Product:** Tutoring Marketplace Platform
**Version:** 1.1
**Last Updated:** January 25, 2026

---

## Backlog Overview

This backlog organizes work into sequential phases and epics. Each item describes an outcome, not implementation details. Phases are ordered by dependency and business priority.

---

## Phase 1: Foundation

*Establish the platform presence and basic infrastructure*

| Epic | Outcome | Priority |
|------|---------|----------|
| **1.1 Landing Experience** | Visitors understand the platform value proposition and can browse tutors without registering | Must Have |
| **1.2 Guest Tutor Browsing** | Unregistered users can search and view tutor profiles (contact details hidden) | Must Have |

---

## Phase 2: User Identity

*Enable users to create accounts and manage their presence*

| Epic | Outcome | Priority |
|------|---------|----------|
| **2.1 Registration & Login** | Users can create accounts via email or social sign-in | Must Have |
| **2.2 Session Security** | User sessions are secure with appropriate expiration | Must Have |
| **2.3 Password Management** | Users can reset forgotten passwords and change existing ones | Must Have |
| **2.4 Learner Profile** | Learners can manage personal details and learning preferences | Must Have |

---

## Phase 3: Tutor Ecosystem

*Build the supply side of the marketplace*

| Epic | Outcome | Priority |
|------|---------|----------|
| **3.1 Tutor Onboarding** | Learners can apply to become tutors with required information | Must Have |
| **3.2 Document Verification** | Tutors can upload credentials; admins can review and approve | Must Have |
| **3.3 Tutor Profile Management** | Tutors can manage subjects, rates, bio, and availability calendar | Must Have |
| **3.4 Verified Badge Display** | Approved tutors display verification status publicly | Must Have |
| **3.5 Teaching Mode & Location** | Tutors can specify online/in-person and service area | Must Have |

---

## Phase 4: Discovery

*Help learners find the right tutors*

| Epic | Outcome | Priority |
|------|---------|----------|
| **4.1 Tutor Search** | Learners can search tutors by subject and keywords | Must Have |
| **4.2 Search Filters** | Results filterable by price, rating, availability, teaching mode | Must Have |
| **4.3 Map-Based Discovery** | Learners can view tutors on a map (approximate location) | Should Have |
| **4.4 Tutor Profile View** | Detailed tutor information visible including reviews and credentials | Must Have |

---

## Phase 5: Booking & Scheduling

*Enable session reservations*

| Epic | Outcome | Priority |
|------|---------|----------|
| **5.1 Availability Calendar** | Learners can view tutor availability and select time slots | Must Have |
| **5.2 Booking Request Flow** | Learners can request sessions; tutors can accept/decline | Must Have |
| **5.3 Recurring Bookings** | Support for scheduling repeated sessions | Should Have |
| **5.4 Session Lifecycle** | Clear states: pending, confirmed, completed, cancelled | Must Have |
| **5.5 In-Person Check-In** | Mechanism to verify in-person sessions occurred | Should Have |
| **5.6 Cancellation Policy Engine** | Automated enforcement of cancellation rules based on timing | Must Have |
| **5.7 No-Show Handling** | Learner and tutor no-show detection and automated consequences | Must Have |

---

## Phase 6: Payments & Financials

*Handle money securely and fairly*

| Epic | Outcome | Priority |
|------|---------|----------|
| **6.1 Payment Integration** | Secure payment processing for booking confirmation | Must Have |
| **6.2 Escrow System** | Funds held until session completion | Must Have |
| **6.3 Commission & Payout** | Platform commission deducted; remainder available to tutor | Must Have |
| **6.4 Receipt Generation** | Automated receipts for learners and tutors | Should Have |
| **6.5 Tutor Wallet Dashboard** | Tutors can view pending, available, and withdrawn balances with transaction history | Must Have |
| **6.6 Withdrawal Requests** | Tutors can request withdrawals of available balance (min £20) | Must Have |
| **6.7 Bank Account Verification** | Tutors must verify UK bank account details before first withdrawal | Must Have |
| **6.8 Payout Processing** | Weekly automated payout runs with bank transfers | Must Have |
| **6.9 Annual Earnings Statement** | Generate yearly earnings summary for tutor tax purposes | Should Have |
| **6.10 Cancellation Refund Processing** | Automated refunds based on cancellation timing rules | Must Have |

---

## Phase 7: Communication

*Enable safe interaction between users*

| Epic | Outcome | Priority |
|------|---------|----------|
| **7.1 Post-Booking Chat** | Messaging enabled after booking is confirmed and paid | Must Have |
| **7.2 Message Persistence** | Chat history preserved for reference and disputes | Must Have |
| **7.3 Off-Platform Warning** | Users warned against sharing personal contact details | Should Have |
| **7.4 Safety Flagging** | Suspicious content automatically flagged for review | Should Have |

---

## Phase 8: Reviews & Trust

*Build credibility through feedback*

| Epic | Outcome | Priority |
|------|---------|----------|
| **8.1 Post-Session Reviews** | Learners prompted to rate and review after completed sessions | Must Have |
| **8.2 Rating Display** | Average ratings visible on tutor cards and profiles | Must Have |
| **8.3 Review Moderation** | Tutors can report inappropriate reviews for admin review | Should Have |

---

## Phase 9: Reverse Discovery

*Let learners attract tutors*

| Epic | Outcome | Priority |
|------|---------|----------|
| **9.1 Tuition Requests** | Learners can post requests describing their tutoring needs | Should Have |
| **9.2 Tutor Interest Expression** | Verified tutors can express interest in learner requests | Should Have |
| **9.3 Learner-Initiated Contact** | Learners can start conversations with interested tutors | Should Have |

---

## Phase 10: Dispute Resolution

*Handle conflicts fairly*

| Epic | Outcome | Priority |
|------|---------|----------|
| **10.1 Dispute Initiation** | Learners can raise disputes within allowed window | Must Have |
| **10.2 Escrow Freeze** | Disputed funds held until resolution | Must Have |
| **10.3 Evidence Submission** | Both parties can provide information for disputes | Must Have |
| **10.4 Admin Resolution** | Admins can resolve with refund, partial refund, or release | Must Have |

---

## Phase 11: Administration

*Platform management and oversight*

| Epic | Outcome | Priority |
|------|---------|----------|
| **11.1 Admin Dashboard** | Overview of users, bookings, and revenue | Must Have |
| **11.2 User Management** | Ability to view, suspend, or ban users | Must Have |
| **11.3 Verification Queue** | Interface to review and action tutor documents | Must Have |
| **11.4 Financial Overview** | Transaction logs, commission tracking, payout management | Must Have |
| **11.5 Chat Oversight** | Read-only access to user conversations for compliance | Should Have |
| **11.6 Audit Logging** | Immutable record of admin actions | Should Have |
| **11.7 Platform Configuration** | Adjustable settings (commission rates, etc.) | Should Have |

---

## Phase 12: Notifications

*Keep users informed*

| Epic | Outcome | Priority |
|------|---------|----------|
| **12.1 Email Notifications** | Automated emails for key events (registration, booking, payment) | Must Have |
| **12.2 In-App Notifications** | Real-time alerts within the platform | Should Have |
| **12.3 Session Reminders** | Notifications before scheduled sessions | Should Have |
| **12.4 Cancellation Notifications** | Automated alerts with refund/compensation details | Must Have |
| **12.5 Withdrawal Notifications** | Confirmation of withdrawal request and payout completion | Must Have |

---

## Phase 13: Legal & Compliance

*Ensure regulatory compliance and user protection*

| Epic | Outcome | Priority |
|------|---------|----------|
| **13.1 Privacy Policy & Terms** | Privacy Policy, Terms of Service, and Cookie Policy displayed and accepted at registration | Must Have |
| **13.2 GDPR Data Rights** | Users can request access, rectification, deletion, and portability of their data | Must Have |
| **13.3 Data Retention Automation** | Automated enforcement of retention periods with scheduled data purging | Should Have |
| **13.4 Minors Protection** | Age verification, parental consent flow, and linked parent accounts for under-18 users | Must Have |
| **13.5 Safeguarding Guidelines** | Tutors acknowledge safeguarding requirements when working with minors | Must Have |
| **13.6 Independent Contractor Agreement** | Tutors accept contractor classification during onboarding | Must Have |
| **13.7 DBS Certificate Upload** | Optional upload and display of DBS certificates for tutors | Should Have |
| **13.8 Cookie Consent** | Cookie banner with consent management for non-essential cookies | Must Have |
| **13.9 Data Export** | Generate downloadable data package for user data portability requests | Should Have |

---

## Future Phases (Post-MVP)

*Items for consideration after initial launch*

| Epic | Outcome | Priority |
|------|---------|----------|
| **F.1 Mobile Applications** | Native iOS and Android apps | Future |
| **F.2 Video Integration** | Built-in video sessions | Future |
| **F.3 AI Matching** | Intelligent tutor recommendations | Future |
| **F.4 Group Sessions** | Multi-learner tutoring support | Future |
| **F.5 Subscription Plans** | Package-based pricing options | Future |
| **F.6 Tutor Analytics** | Performance insights for tutors | Future |
| **F.7 Geographic Expansion** | Multi-region and multi-currency support | Future |
| **F.8 API & Integrations** | Third-party integrations and public API | Future |

---

## Prioritization Key

| Label | Meaning |
|-------|---------|
| **Must Have** | Required for MVP launch |
| **Should Have** | Important but can launch without |
| **Future** | Post-MVP consideration |

---

## Notes

- Phases are sequential but some epics within phases can be parallelized
- Priorities may shift based on user research and stakeholder feedback
- Each epic should be refined into user stories before development
- This backlog is a living document; update as decisions are made
- Phase 13 (Legal & Compliance) items should be addressed throughout development, not deferred to the end

---

*Last reviewed: January 25, 2026*
*Version 1.1: Added cancellation policy epics (5.6, 5.7), expanded wallet/withdrawal epics (6.5-6.10), added compliance phase (13)*
