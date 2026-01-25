Functional Requirements Document (FRD)

**Project Name:** Tutoring Marketplace Platform

**Version:** 1.2

**Date:** Jan 25, 2026

**Author:** Dev Team

**1\. Document Overview**

**1.1 Purpose**

The purpose of this document is to translate the high-level business objectives outlined in the Business Requirements Document (BRD) into detailed, functional specifications. It serves as a guide for the development team to build a centralized, trusted, and scalable digital marketplace that connects students with qualified tutors.

**1.2 Scope**

The system will function as a "digital bridge" facilitating the entire tutoring lifecycle, including:

*   User registration and profile management.
*   Tutor discovery and verification.
*   Secure booking and scheduling.
*   Payment processing with commission management.
*   Post-session reviews and administration.

**1.3 Assumptions and Constraints**

**Internet Dependency:** The platform requires an active internet connection for all users.

**Platform Exclusivity:** All bookings and payments must occur on the platform to ensure trust and revenue generation.

**Geography:** Initial rollout targets the UK market but supports scalability.

**2\. User Roles & Access Levels**

The system must support the following user roles:

**Guest:** An unregistered user who can browse the landing page and search for tutors but cannot view contact details or book sessions.

**Learner (Student/Parent):** A registered user seeking tutoring services.

**Tutor:** A registered professional offering educational services.

**Admin:** The system owner/manager responsible for verification, moderation, and platform health.

**3\. Authentication & Authorization**

**3.1 User Registration & Login**

*   **FR-3.1.1:** The system shall allow users to register using a valid Email and Password.
*   **FR-3.1.2:** The system shall support Google Sign-In (OAuth) for one-click registration.
*   **FR-3.1.3 (Default Role):** Upon registration, all users shall be assigned the Learner role by default.

**3.2 Session Management**

*   **FR-3.2.1:** The system shall use JWT (JSON Web Tokens) for secure authentication.
*   **FR-3.2.2:** Sessions shall have a configurable expiration time requiring re-login for security.

**3.3 Password Management**

*   **FR-3.3.1:** Users shall be able to request a password reset link via email.
*   **FR-3.3.2:** Users shall be able to change their password from the account settings page.

**3.4 Access Control Boundaries (New)**

*   **FR-3.4.1 (Learner Restriction):** Learners shall not have access to any Tutor's financial data, payout history, or other Learners' personal contact information.
*   **FR-3.4.2 (Tutor Restriction):** Tutors shall not have access to Admin dashboards, platform configuration settings, or financial data of other Tutors.
*   **FR-3.4.3 (Admin Restriction):** Admins shall have "God Mode" view access to data for support purposes but **shall not** be permitted to book sessions or initiate financial transactions on behalf of users (to preserve data integrity).

**4\. User Profile Management**

**4.1 Learner Profile**

*   **FR-4.1.1:** Learners can manage basic details (Name, Profile Picture, Phone Number).
*   **FR-4.1.2:** Learners can set learning preferences (e.g., Grade Level, Subjects of Interest).
*   **FR-4.1.3:** The system shall display a history of past and upcoming bookings.

**4.2 Tutor Profile**

**FR-4.2.1:** Tutors must provide professional details: Headline, Bio, Years of Experience, and Education.

**FR-4.2.2:** Tutors can select "Teaching Modes" (Online, In-Person, or Both).

*   **FR-4.2.3:** Tutors must set an hourly rate per subject.
*   **FR-4.2.4:** Tutors shall manage an "Availability Calendar" to block off unavailable times.
*   **FR-4.2.5:** Tutors offering In-Person services must define a Service Area (Location/Radius).

**4.3 Admin Profile**

*   **FR-4.3.1:** Admins shall have access to platform configuration settings (e.g., commission rates).

**5\. Tutor Onboarding & Verification**

**5.1 Tutor Role Upgrade Flow**

*   **FR-5.1.1:** The system shall provide a "Become a Tutor" option on the Learner dashboard.
*   **FR-5.1.2:** Selecting "Become a Tutor" shall initiate the Tutor onboarding flow.
*   **FR-5.1.3:** Users must complete mandatory Tutor profile details, including subjects, rates, availability, and bio.
*   **FR-5.1.4:** Users must upload required qualification documents for verification.
*   **FR-5.1.5 (Role Activation):** Upon completion of the Tutor onboarding flow, the system shall assign the Tutor role to the user with an initial status of "Unverified Tutor".
*   **FR-5.1.6 (Verification Status):** The Tutor profile shall remain unverified until Admin approval of submitted documents.
*   **FR-5.1.7 (Verified Badge):** Upon Admin approval of Tutor certificates/documents, the system shall mark the Tutor as "Verified" and display a Verified Badge on the Tutor's public profile.

**5.2 Certificate Verification**

**FR-5.2.1:** Tutors must upload proof of qualifications (Degrees, Certifications, IDs).

*   **FR-5.2.2:** The system shall trigger a notification to the admin upon document submission.
*   **FR-5.2.3:** The Admin shall have an interface to View, Approve, or Reject documents.

**FR-5.2.4:** Upon Admin approval, a "Verified Badge" shall be prominently displayed on the Tutor's public profile to build trust.

**6\. Tutor Discovery & Browsing**

**6.1 Search and Filters**

*   **FR-6.1.1:** Learners can search for tutors by Subject or Keyword.
*   **FR-6.1.2:** Search results must be filterable by: Price Range, Minimum Rating, Availability, and Teaching Mode.

**6.2 Location-Based Discovery**

*   **FR-6.2.1:** The system shall integrate OpenStreetMap (Leaflet) to show tutors on a map view.
*   **FR-6.2.2:** For privacy, the map shall display the approximate location (e.g., postal code district) rather than the exact address.

**6.3 Profile Viewing**

*   **FR-6.3.1:** Learners can view a detailed Tutor Profile including Bio, Subjects, Verified Badge, and Reviews.

**7\. Learner Discovery (Reverse Browsing)**

**7.1 Learner Requests**

*   **FR-7.1.1:** Learners can post "Tuition Requests" specifying Subject, Budget, Mode, and Description.

**7.2 Tutor Interaction**

*   **FR-7.2.1:** Verified Tutors can browse active Learner Requests.
*   **FR-7.2.2:** Tutors can "Express Interest" in a request.
*   **FR-7.2.3:** Tutors cannot initiate direct chat; expressing interest notifies the Learner, who can then choose to initiate the conversation.

**8\. Booking & Scheduling**

**8.1 Session Booking**

*   **FR-8.1.1:** Bookings must be initiated through the platform to prevent off-platform leakage.
*   **FR-8.1.2:** Learners select a specific time slot from the Tutor's Availability Calendar.
*   **FR-8.1.3:** The system supports both one-off sessions and recurring bookings.

**8.2 Booking Lifecycle & Completion Logic (Updated)**

*   **FR-8.2.1 Pending:** Booking request sent to Tutor.
*   **FR-8.2.2 Confirmed:** Tutor accepts the request AND payment is secured.
*   **FR-8.2.3 Completed (Auto-Confirmation):** By default, a session is marked "Completed" 24 hours after the scheduled end time unless a dispute is raised.
*   **FR-8.2.4 Completed (Manual):** Learners can manually mark a session as "Completed" immediately after it ends.
*   **FR-8.2.5 Offline Proof:** For in-person sessions, the system shall provide a "Check-in" feature where the Tutor clicks "Start Session" and the Learner must acknowledge via a prompt/OTP on their device to validate the session occurred.
*   **FR-8.2.6 Cancelled:** Either party cancels (subject to cancellation rules defined in FR-8.3).

**8.3 Cancellation Policy Rules**

*   **FR-8.3.1 (Learner Cancellation - 24+ hours):** If a Learner cancels 24 or more hours before the scheduled session start time, the system shall issue a 100% refund to the Learner. No payment shall be made to the Tutor. No platform commission shall be charged.
*   **FR-8.3.2 (Learner Cancellation - 12-24 hours):** If a Learner cancels between 12 and 24 hours before the scheduled session start time, the system shall issue a 75% refund to the Learner. 25% of the session fee shall be credited to the Tutor's wallet (no commission deducted on cancellation compensation).
*   **FR-8.3.3 (Learner Cancellation - 2-12 hours):** If a Learner cancels between 2 and 12 hours before the scheduled session start time, the system shall issue a 50% refund to the Learner. 50% of the session fee shall be credited to the Tutor's wallet (no commission deducted on cancellation compensation).
*   **FR-8.3.4 (Learner Cancellation - Less than 2 hours):** If a Learner cancels less than 2 hours before the scheduled session start time, no refund shall be issued. 100% of the session fee shall be credited to the Tutor's wallet after standard platform commission deduction.
*   **FR-8.3.5 (Learner No-Show):** If a Learner fails to attend a confirmed session without cancelling, the session shall be marked as "Learner No-Show" by the Tutor. No refund shall be issued. The Tutor shall receive payment minus standard commission after the 24-hour dispute window.
*   **FR-8.3.6 (Tutor Cancellation):** If a Tutor cancels a confirmed booking at any time before the session, the system shall issue a 100% refund to the Learner. The cancellation shall be recorded on the Tutor's profile metrics.
*   **FR-8.3.7 (Tutor No-Show):** If a Tutor fails to attend a confirmed session, the Learner may report a "Tutor No-Show." Upon verification, a 100% refund shall be issued and a strike recorded against the Tutor. Three strikes shall trigger an automatic Admin review of the Tutor's account.
*   **FR-8.3.8 (Pending Booking Cancellation):** If a booking is cancelled before Tutor acceptance, no financial transaction occurs. If cancelled after acceptance but before payment, no refund is required.
*   **FR-8.3.9 (Cancellation Notification):** The system shall send email and in-app notifications to both parties upon cancellation, including refund/compensation amounts and reason.
*   **FR-8.3.10 (Recurring Booking Cancellation):** Cancelling a recurring booking shall apply only to future sessions. The cancellation policy (FR-8.3.1 through FR-8.3.4) applies individually to each upcoming session based on its scheduled time.

**9\. Payment, Revenue & Dispute Management**

**9.1 Payment Processing**

**FR-9.1.1:** The system shall integrate a secure Payment Gateway (e.g., Stripe).

*   **FR-9.1.2:** Learners must pay upfront to confirm a booking.

**9.2 Escrow & Commission**

*   **FR-9.2.1:** Payments are held in an "Escrow" state until the session is successfully completed (see FR-8.2.3).

**FR-9.2.2:** The system automatically deducts a platform commission (X%) before transferring the remaining balance to the Tutor's wallet.

*   **FR-9.2.3:** Funds are released to the Tutor's withdrawable balance 24 hours after session completion.

**9.3 Tutor Wallet**

*   **FR-9.3.1 (Wallet Balance States):** The Tutor wallet shall track earnings in three states:
    *   **Pending:** Funds held in escrow for sessions not yet completed or within the dispute window.
    *   **Available:** Funds eligible for withdrawal (session completed + 24-hour hold passed + no dispute).
    *   **Withdrawn:** Funds that have been transferred to the Tutor's bank account.
*   **FR-9.3.2 (Balance Display):** The Tutor dashboard shall display all three balance states clearly, along with a transaction history showing the movement of funds between states.
*   **FR-9.3.3 (Earnings Breakdown):** Each transaction in the wallet shall show: Session date, Learner name, Gross amount, Commission deducted, and Net amount credited.

**9.4 Withdrawal Rules**

*   **FR-9.4.1 (Minimum Withdrawal):** Tutors must have a minimum of £20 in Available balance to request a withdrawal.
*   **FR-9.4.2 (Payout Schedule):** Withdrawal requests shall be processed weekly (every Monday). Requests submitted by Sunday 23:59 UK time shall be included in the Monday payout run.
*   **FR-9.4.3 (Payout Method):** Payouts shall be made via bank transfer to UK bank accounts only (for MVP).
*   **FR-9.4.4 (Processing Time):** Bank transfers shall complete within 2-3 business days after the payout run.
*   **FR-9.4.5 (Bank Account Verification):** Tutors must provide and verify bank account details (account holder name, sort code, account number) before their first withdrawal.
*   **FR-9.4.6 (Withdrawal Request):** Tutors shall be able to request withdrawal of any amount up to their full Available balance via the Tutor dashboard.
*   **FR-9.4.7 (Withdrawal Confirmation):** Upon successful payout processing, the system shall send an email notification to the Tutor with the amount transferred and transaction reference.

**9.5 Invoicing**

*   **FR-9.5.1:** Automated receipt generation for Learners and commission invoices for Tutors.
*   **FR-9.5.2 (Annual Statement):** The system shall generate an annual earnings statement for each Tutor, summarizing total earnings, total commission paid, and net payouts for tax purposes.

**9.6 Dispute Resolution Flow**

*   **FR-9.6.1 (Dispute Window):** Learners shall have the ability to raise a "Dispute" button on a past booking within 24 hours of the session end time.
*   **FR-9.6.2 (Escrow Freeze):** Raising a dispute immediately pauses the release of funds from Escrow to the Tutor.
*   **FR-9.6.3 (Evidence):** The Dispute interface shall require the Learner to select a reason (e.g., "Tutor No-Show," "Poor Quality") and allow text description/file uploads as evidence.
*   **FR-9.6.4 (Admin Resolution):** Admins shall have options to resolve the dispute by:
    *   **Full Refund:** Funds returned to Learner.
    *   **Release Payment:** Funds released to Tutor (claim rejected).
    *   **Partial Refund:** Split amount between Learner and Tutor.

**10\. Chat & Communication**

**10.1 Access Control**

*   **FR-10.1.1:** Critical: Chat functionality is enabled only after a booking is confirmed and paid for (or Learner initiates after Tutor expresses interest).

**10.2 Features**

*   **FR-10.2.1:** Real-time messaging using WebSockets.
*   **FR-10.2.2:** The system persists message history for dispute resolution.
*   **FR-10.2.3:** The interface shall warn users against sharing personal phone numbers or emails.

**10.3 Admin Conversation Oversight (New)**

*   **FR-10.3.1 (Read-Only Access):** The system shall allow Admin users to view chat conversations between any Tutor and Learner in a read-only mode.
*   **FR-10.3.2 (Integrity):** Admins shall **not** be able to send, edit, or delete messages within user conversations.
*   **FR-10.3.3 (Metadata):** The Admin chat view shall display: Tutor name/link, Learner name/link, Associated booking ID, and Timestamped message history.
*   **FR-10.3.4 (Search & Filter):** Admins shall be able to search and filter conversations by Tutor, Learner, Booking ID, or Date range.
*   **FR-10.3.5 (Safety Flagging):** The system shall automatically flag conversations containing suspicious keywords (e.g., phone numbers, email IDs, "Zoom link", "pay cash") for Admin review to prevent platform leakage.

**11\. Reviews & Ratings**

**11.1 Feedback Mechanism**

**FR-11.1.1:** Learners are prompted to leave a review (Text) and Rating (1-5 Stars) after a session acts as "Completed".

*   **FR-11.1.2:** Tutors cannot delete reviews but can report them to Admin for moderation.

**11.2 Display**

*   **FR-11.2.1:** Average rating and review count are displayed on the Tutor Card and Profile.

**12\. Admin Panel Functionalities**

**12.1 Dashboard**

**FR-12.1.1:** Overview of Total Users, Active Bookings, and Total Revenue.

**12.2 User & Content Management**

*   **FR-12.2.1:** List view of all Learners and Tutors with options to Suspend or Ban users.
*   **FR-12.2.2:** Queue for reviewing Tutor Certificates (Approve/Reject).

**12.3 Financials**

*   **FR-12.3.1:** View transaction logs, commission totals, and pending payouts.
*   **FR-12.3.2:** Ability to refund payments in case of resolved disputes.
*   **FR-12.3.3 (Payout Management):** Admin interface to view pending withdrawal requests, process payouts, and manage failed transfers.
*   **FR-12.3.4 (Financial Reports):** Generate reports on platform revenue, tutor payouts, refunds issued, and escrow balances.

**12.4 Audit Logs (New)**

*   **FR-12.4.1:** The system shall maintain an immutable Audit Log of all critical Admin actions, including:
    *   Banning/Unbanning users.
    *   Approving/Rejecting documents.
    *   Issuing Refunds or interfering with Escrow.
    *   Viewing private chat logs.
*   **FR-12.4.2:** Logs must include the Admin ID, Action Type, Timestamp, and IP Address.

**13\. Notifications & Alerts**

**13.1 Triggers**

The system shall send Email and In-App notifications for:

*   **Registration:** Welcome email.
*   **Verification:** Certificate approved/rejected.
*   **Booking:** New request (Tutor), Booking Confirmed (Both).
*   **Session:** Reminder 1 hour before session.
*   **Cancellation:** Cancellation confirmation with refund/compensation details (Both).
*   **Payment:** Receipt (Learner), Payout processed (Tutor).
*   **Dispute:** Notification to both parties when a dispute is raised/resolved.
*   **Withdrawal:** Confirmation when withdrawal request is submitted and when payout completes.

**14\. Security & Compliance**

*   **FR-14.1 Data Privacy:** Personal contact details (phone/email) are masked until necessary or restricted to platform channels.
*   **FR-14.2 Encryption:** All data in transit (SSL/TLS) and sensitive data at rest (passwords) must be encrypted.
*   **FR-14.3 Secure Uploads:** Certificate files must be stored in a secure bucket with restricted access URLs.
*   **FR-14.4 Admin Chat Access Control:** Admin access to Tutor-Learner conversations shall be strictly read-only and logged for audit purposes.
*   **FR-14.5 User Transparency:** Users shall be informed via platform policy and/or UI notice that in-app communications may be monitored by Admins for safety, compliance, dispute resolution, and fraud prevention.
*   **FR-14.6 Data Isolation:** Conversation data shall not be accessible outside the Admin Panel or shared with unauthorized users or external systems.

**15\. Non-Functional Requirements**

**15.1 Performance & Reliability**

*   **NFR-1 (Performance):** Dashboard and search results should load within 2 seconds.
*   **NFR-2 (Scalability):** The backend structure must support horizontal scaling.
*   **NFR-3 (Availability):** The platform should aim for 99.9% uptime.
*   **NFR-4 (Usability):** The UI should be responsive (Mobile, Tablet, Desktop).

**15.2 Legal & Regulatory Compliance**

*   **NFR-5 (UK GDPR Compliance):** The platform shall comply with UK General Data Protection Regulation and Data Protection Act 2018, including:
    *   Lawful basis for processing (consent and contract performance).
    *   Data minimization principles.
    *   Privacy by design in all features.
    *   Data breach notification procedures (72-hour ICO notification where required).

*   **NFR-6 (User Data Rights):** The system shall support user rights requests within 30 days:
    *   **Right of Access:** Users can request a copy of all personal data held.
    *   **Right to Rectification:** Users can correct inaccurate personal data.
    *   **Right to Erasure:** Users can request deletion of personal data (subject to legal retention requirements).
    *   **Right to Data Portability:** Users can receive their data in a machine-readable format.
    *   **Right to Object:** Users can object to specific processing activities.

*   **NFR-7 (Data Retention):** The platform shall enforce the following retention periods:
    *   User account data: Duration of account + 2 years after deletion.
    *   Booking and payment records: 7 years (UK tax/financial regulations).
    *   Chat messages: 2 years from last message in conversation.
    *   Tutor verification documents: Duration of tutor status + 1 year.
    *   Audit logs: 7 years.
    *   Upon account deletion: Personal data anonymized immediately; financial records retained per legal requirements.

*   **NFR-8 (Minors Protection):** The platform shall implement safeguards for users under 18:
    *   Age declaration required during registration.
    *   Users under 18 must have a linked parent/guardian account.
    *   Parent accounts shall have visibility into bookings, messages, and payment history of linked minor accounts.
    *   All tutors interacting with minors shall acknowledge safeguarding guidelines.
    *   DBS certificate upload shall be available (optional for MVP, may become mandatory).

*   **NFR-9 (Tutor Classification):** Tutors shall be classified as Independent Contractors:
    *   Tutors must accept Independent Contractor Agreement during onboarding.
    *   Platform shall not control tutoring methods, schedules, or pricing.
    *   Tutors are responsible for their own tax obligations (self-assessment).
    *   Platform shall provide annual earnings statements to support tax filing.
    *   No employment benefits or protections shall be implied or provided.

*   **NFR-10 (Financial Compliance):**
    *   Payment processing shall use PCI DSS compliant gateway (Stripe).
    *   Transaction monitoring for suspicious patterns (anti-money laundering).
    *   Clear consumer pricing with no hidden fees.
    *   Platform terms shall clearly define intermediary status.

*   **NFR-11 (Privacy Policy & Terms):** The platform shall maintain and display:
    *   Privacy Policy (accessible from all pages, required acceptance at registration).
    *   Terms of Service (required acceptance at registration).
    *   Cookie Policy (with consent banner for non-essential cookies).
    *   Independent Contractor Agreement (for tutors during onboarding).

**16\. Technology Stack (Context)**

*   **Frontend:** React (MERN Stack), shadcn UI.
*   **Backend:** Node.js with Express.js.
*   **Database:** MongoDB.
*   **Authentication:** JWT and Google OAuth 2.0.
*   **Media:** S3.
*   **Real-time:** Socket.io.
*   **Maps:** OpenStreetMap + Leaflet.

**17\. Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 21, 2026 | Dev Team | Initial FRD |
| 1.1 | Jan 21, 2026 | Dev Team | Added access control boundaries, dispute flow, admin chat oversight, audit logs |
| 1.2 | Jan 25, 2026 | Dev Team | Added FR-8.3 Cancellation Policy Rules, FR-9.3-9.4 Tutor Wallet & Withdrawal, NFR-5 through NFR-11 Legal & Compliance Requirements |
