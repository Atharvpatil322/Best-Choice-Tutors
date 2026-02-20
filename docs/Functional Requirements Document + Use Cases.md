Functional Requirements Document (FRD)

**Project Name:** Tutoring Marketplace Platform 

**Version:** 1.1 

**Date:** Jan 21, 2026

**Author:** Dev Team

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

**Internet Dependency:** The platform requires an active internet connection for all users.

**Platform Exclusivity:** All bookings and payments must occur on the platform to ensure trust and revenue generation.

**2\. User Roles & Access Levels**

The system must support the following user roles:

**Guest:** An unregistered user who can browse the landing page and search for tutors but cannot view contact details or book sessions.

**Learner (Student/Parent):** A registered user seeking tutoring services.

**Tutor:** A registered professional offering educational service.

**Admin:** The system owner/manager responsible for verification, moderation, and platform health.

**3\. Authentication & Authorization**

**3.1 User Registration & Login**

*   **FR-3.1.1:** The system shall allow users to register using a valid Email and Password.
*   **FR-3.1.2:** The system shall support Google Sign-In (OAuth) for one-click registration.
*   **FR-3.1.3 (Default Role):** Upon registration, all users shall be assigned the Learner role by default.

**3.2 Session Management**

*   **FR-3.2.1:** The system shall use JWT (JSON Web Tokens) for secure authentication.
*   **FR-3.2.2:** Sessions shall have a configurable expiration time requiring re-login for security.

**3.3 Password Management**

*   **FR-3.3.1:** Users shall be able to request a password reset link via email.
*   **FR-3.3.2:** Users shall be able to change their password from the account settings page.

**3.4 Access Control Boundaries (New)**

*   **FR-3.4.1 (Learner Restriction):** Learners shall not have access to any Tutor's financial data, payout history, or other Learners' personal contact information.
*   **FR-3.4.2 (Tutor Restriction):** Tutors shall not have access to Admin dashboards, platform configuration settings, or financial data of other Tutors.
*   **FR-3.4.3 (Admin Restriction):** Admins shall have "God Mode" view access to data for support purposes but **shall not** be permitted to book sessions or initiate financial transactions on behalf of users (to preserve data integrity).

**Use Cases for Authentication & Authorization**

**UC-3.1: User Registration with Email**

**Use Case Name:** Register New Account with Email and Password

**Primary Actor:** Guest (Unregistered User)

**Secondary Actors:** System, Email Service

**Preconditions:**

*   User has a valid email address
*   User is not already registered with the same email

**Trigger:** User clicks "Sign Up" or "Register" button on the platform

**Main Flow:**

1.  System displays the registration form
2.  User enters email address and creates a password
3.  User submits the registration form
4.  System validates email format and password strength
5.  System creates a new user account with Learner role (default)
6.  System sends a welcome email to the user
7.  System redirects user to their Learner dashboard

**Alternate Flows:**

*   **AF-3.1.1 (Duplicate Email):** If email already exists, system displays error message "An account with this email already exists" and prompts user to login or reset password
*   **AF-3.1.2 (Invalid Password):** If password doesn't meet requirements, system displays password policy and prompts user to re-enter
*   **AF-3.1.3 (Email Delivery Failure):** If welcome email fails, system logs the error but completes registration; user can request resend later

**UC-3.2: User Registration with Google OAuth**

**Use Case Name:** Register New Account via Google Sign-In

**Primary Actor:** Guest (Unregistered User)

**Secondary Actors:** System, Google OAuth Service

**Preconditions:**

*   User has a valid Google account
*   User is not already registered with the same Google account

**Trigger:** User clicks "Sign in with Google" button

**Main Flow:**

1.  System redirects user to Google authentication page
2.  User authenticates with Google credentials
3.  Google returns authentication token and user profile data
4.  System verifies the OAuth token
5.  System creates a new user account with Learner role using Google profile data
6.  System generates a JWT session token
7.  System redirects user to their Learner dashboard

**Alternate Flows:**

*   **AF-3.2.1 (Existing Account):** If Google email matches existing account, system links Google OAuth to existing account and logs user in
*   **AF-3.2.2 (OAuth Denied):** If user denies Google permissions, system returns user to registration page with message
*   **AF-3.2.3 (OAuth Failure):** If Google authentication fails, system displays error and offers email registration alternative

**UC-3.3: User Login**

**Use Case Name:** Authenticate Existing User

**Primary Actor:** Registered User (Learner/Tutor/Admin)

**Secondary Actors:** System

**Preconditions:**

*   User has an existing account
*   User is not currently logged in

**Trigger:** User navigates to login page and enters credentials

**Main Flow:**

1.  System displays login form
2.  User enters email and password (or clicks Google Sign-In)
3.  System validates credentials against stored data
4.  System generates JWT token with appropriate role permissions
5.  System creates user session with configured expiration time
6.  System redirects user to role-appropriate dashboard

**Alternate Flows:**

*   **AF-3.3.1 (Invalid Credentials):** If credentials don't match, system displays "Invalid email or password" without specifying which is incorrect
*   **AF-3.3.2 (Account Suspended):** If user account is suspended, system displays suspension notice and prevents login
*   **AF-3.3.3 (Session Expired):** If user had expired session cookie, system clears it and proceeds with fresh login

**UC-3.4: Password Reset**

**Use Case Name:** Reset Forgotten Password

**Primary Actor:** Registered User

**Secondary Actors:** System, Email Service

**Preconditions:**

*   User has an existing account with email/password authentication
*   User has access to their registered email

**Trigger:** User clicks "Forgot Password" link on login page

**Main Flow:**

1.  System displays password reset request form
2.  User enters registered email address
3.  System validates email exists in database
4.  System generates unique, time-limited reset token
5.  System sends password reset link to user's email
6.  User clicks reset link in email
7.  System validates token and displays new password form
8.  User enters and confirms new password
9.  System updates password and invalidates reset token
10.  System redirects user to login page with success message

**Alternate Flows:**

*   **AF-3.4.1 (Unknown Email):** If email not found, system displays same success message (security measure) but doesn't send email
*   **AF-3.4.2 (Expired Token):** If reset token has expired, system displays message and offers to send new reset link
*   **AF-3.4.3 (Token Already Used):** If token was already used, system displays error and offers to send new reset link

**UC-3.5: Change Password**

**Use Case Name:** Update Account Password

**Primary Actor:** Authenticated User

**Secondary Actors:** System

**Preconditions:**

*   User is logged in
*   User has email/password authentication (not OAuth-only)

**Trigger:** User navigates to Account Settings and selects "Change Password"

**Main Flow:**

1.  System displays password change form
2.  User enters current password
3.  User enters and confirms new password
4.  System validates current password is correct
5.  System validates new password meets requirements
6.  System updates password in database
7.  System displays success confirmation
8.  System optionally invalidates other active sessions

**Alternate Flows:**

*   **AF-3.5.1 (Wrong Current Password):** If current password incorrect, system displays error "Current password is incorrect"
*   **AF-3.5.2 (Same Password):** If new password matches current, system displays "New password must be different from current password"

**UC-3.6: Access Control Enforcement**

**Use Case Name:** Enforce Role-Based Access Restrictions

**Primary Actor:** Authenticated User (Learner/Tutor/Admin)

**Secondary Actors:** System

**Preconditions:**

*   User is authenticated with valid JWT token
*   User has assigned role (Learner, Tutor, or Admin)

**Trigger:** User attempts to access any protected resource or endpoint

**Main Flow:**

1.  System intercepts the request
2.  System extracts and validates JWT token
3.  System identifies user role from token claims
4.  System checks if requested resource is permitted for user's role
5.  If permitted, system allows access and returns requested data
6.  System logs the access attempt

**Alternate Flows:**

*   **AF-3.6.1 (Learner Accessing Tutor Financials):** If Learner attempts to access Tutor payout data, system returns 403 Forbidden and logs violation
*   **AF-3.6.2 (Tutor Accessing Admin Dashboard):** If Tutor attempts to access Admin routes, system returns 403 Forbidden and redirects to Tutor dashboard
*   **AF-3.6.3 (Admin Transaction Attempt):** If Admin attempts to book session or initiate payment on behalf of user, system blocks action and logs the attempt
*   **AF-3.6.4 (Invalid Token):** If JWT is expired or invalid, system returns 401 Unauthorized and redirects to login

**4\. User Profile Management**

**4.1 Learner Profile**

*   **FR-4.1.1:** Learners can manage basic details (Name, Profile Picture, Phone Number).
*   **FR-4.1.2:** Learners can set learning preferences (e.g., Grade Level, Subjects of Interest).
*   **FR-4.1.3:** The system shall display a history of past and upcoming bookings.

**4.2 Tutor Profile**

**FR-4.2.1:** Tutors must provide professional details: Headline, Bio, Years of Experience, and Education.

**FR-4.2.2:** Tutors can select "Teaching Modes" (Online, In-Person, or Both).

*   **FR-4.2.3:** Tutors must set an hourly rate per subject.
*   **FR-4.2.4:** Tutors shall manage an "Availability Calendar" to block off unavailable times.
*   **FR-4.2.5:** Tutors offering In-Person services must define a Service Area (Location/Radius).

**4.3 Admin Profile**

*   **FR-4.3.1:** Admins shall have access to platform configuration settings (e.g., commission rates).

**Use Cases for User Profile Management**

**UC-4.1: Learner Updates Basic Profile Information**

**Use Case Name:** Update Learner Profile Details

**Primary Actor:** Learner

**Secondary Actors:** System

**Preconditions:**

*   Learner is authenticated and logged in
*   Learner has an existing profile

**Trigger:** Learner navigates to "My Profile" or "Account Settings" page

**Main Flow:**

1.  System displays current profile information (Name, Profile Picture, Phone Number)
2.  Learner modifies desired fields
3.  Learner uploads new profile picture (optional)
4.  Learner clicks "Save Changes"
5.  System validates input data (phone format, image size/type)
6.  System updates profile in database
7.  System displays success confirmation message
8.  System refreshes profile view with updated information

**Alternate Flows:**

*   **AF-4.1.1 (Invalid Phone Format):** If phone number format is invalid, system displays error and highlights field
*   **AF-4.1.2 (Image Too Large):** If profile picture exceeds size limit, system displays error with acceptable size requirements
*   **AF-4.1.3 (Unsupported Image Format):** If image format not supported, system prompts user to upload JPG, PNG, or WebP

**UC-4.2: Learner Sets Learning Preferences**

**Use Case Name:** Configure Learning Preferences

**Primary Actor:** Learner

**Secondary Actors:** System

**Preconditions:**

*   Learner is authenticated
*   Learner profile exists

**Trigger:** Learner accesses "Learning Preferences" section in profile settings

**Main Flow:**

1.  System displays learning preference options
2.  Learner selects Grade Level from dropdown
3.  Learner selects Subjects of Interest (multi-select)
4.  Learner saves preferences
5.  System validates selections
6.  System updates learner preferences in database
7.  System confirms changes saved successfully

**Alternate Flows:**

*   **AF-4.2.1 (No Subjects Selected):** System allows saving with no subjects but displays recommendation to select at least one for better tutor matching

**UC-4.3: Learner Views Booking History**

**Use Case Name:** View Past and Upcoming Sessions

**Primary Actor:** Learner

**Secondary Actors:** System

**Preconditions:**

*   Learner is authenticated
*   Learner has at least one booking (past or upcoming)

**Trigger:** Learner navigates to "My Bookings" or "Session History" page

**Main Flow:**

1.  System retrieves all bookings associated with the Learner
2.  System displays bookings sorted by date (upcoming first, then past)
3.  Each booking shows: Tutor name, Subject, Date/Time, Status, Amount Paid
4.  Learner can filter by status (Upcoming, Completed, Cancelled)
5.  Learner can click on a booking to view full details

**Alternate Flows:**

*   **AF-4.3.1 (No Bookings):** If learner has no bookings, system displays message "You haven't booked any sessions yet" with link to browse tutors

**UC-4.4: Tutor Creates Professional Profile**

**Use Case Name:** Set Up Tutor Professional Details

**Primary Actor:** Tutor

**Secondary Actors:** System

**Preconditions:**

*   User has Tutor role assigned
*   Tutor is authenticated

**Trigger:** Tutor accesses profile setup or edits existing profile

**Main Flow:**

1.  System displays professional profile form
2.  Tutor enters Headline (short professional tagline)
3.  Tutor writes Bio (detailed professional description)
4.  Tutor enters Years of Experience
5.  Tutor adds Education history (degrees, institutions)
6.  Tutor clicks "Save Profile"
7.  System validates all required fields are completed
8.  System saves professional details to database
9.  System displays updated public profile preview

**Alternate Flows:**

*   **AF-4.4.1 (Required Field Missing):** If mandatory field is empty, system highlights missing fields and prevents save
*   **AF-4.4.2 (Bio Too Short):** If Bio is under minimum character count, system prompts for more detail

**UC-4.5: Tutor Configures Teaching Mode**

**Use Case Name:** Set Teaching Mode Preferences

**Primary Actor:** Tutor

**Secondary Actors:** System

**Preconditions:**

*   Tutor is authenticated with Tutor role
*   Tutor has basic profile created

**Trigger:** Tutor accesses "Teaching Settings" or during initial profile setup

**Main Flow:**

1.  System displays teaching mode options
2.  Tutor selects mode: Online, In-Person, or Both
3.  If In-Person or Both selected, system prompts for Service Area
4.  Tutor defines location and radius for in-person services
5.  Tutor saves teaching mode settings
6.  System updates tutor profile with teaching mode
7.  System confirms settings saved

**Alternate Flows:**

*   **AF-4.5.1 (In-Person Without Location):** If Tutor selects In-Person but doesn't provide location, system requires location before saving
*   **AF-4.5.2 (Invalid Radius):** If radius is invalid (negative or exceeds maximum), system displays error

**UC-4.6: Tutor Sets Hourly Rates**

**Use Case Name:** Configure Subject-Based Pricing

**Primary Actor:** Tutor

**Secondary Actors:** System

**Preconditions:**

*   Tutor is authenticated
*   Tutor has selected subjects they teach

**Trigger:** Tutor accesses "Pricing" or "Rates" section in profile

**Main Flow:**

1.  System displays list of subjects the Tutor has selected to teach
2.  For each subject, system shows rate input field
3.  Tutor enters hourly rate for each subject
4.  Tutor clicks "Save Rates"
5.  System validates rates are within platform minimum/maximum bounds
6.  System saves rates to database
7.  System displays confirmation and shows rates on public profile

**Alternate Flows:**

*   **AF-4.6.1 (Rate Below Minimum):** If rate is below platform minimum, system displays minimum rate requirement
*   **AF-4.6.2 (Rate Above Maximum):** If rate exceeds platform maximum, system displays warning about competitiveness

**UC-4.7: Tutor Manages Availability Calendar**

**Use Case Name:** Set and Update Availability Schedule

**Primary Actor:** Tutor

**Secondary Actors:** System

**Preconditions:**

*   Tutor is authenticated
*   Tutor profile is active

**Trigger:** Tutor accesses "Availability" or "Calendar" section

**Main Flow:**

1.  System displays calendar view with current availability settings
2.  Tutor can set recurring weekly availability (e.g., Mon-Fri 9am-5pm)
3.  Tutor can block specific dates/times for personal commitments
4.  Tutor can add one-time available slots outside regular schedule
5.  Tutor saves availability changes
6.  System validates no conflicts exist
7.  System updates availability in database
8.  System syncs availability to public booking calendar

**Alternate Flows:**

*   **AF-4.7.1 (Conflict with Existing Booking):** If tutor tries to block time that has confirmed booking, system warns and prevents blocking
*   **AF-4.7.2 (No Availability Set):** If tutor has no availability, system displays warning that profile won't appear in search results

**UC-4.8: Tutor Defines Service Area**

**Use Case Name:** Set In-Person Service Location

**Primary Actor:** Tutor

**Secondary Actors:** System, OpenStreetMap Service

**Preconditions:**

*   Tutor is authenticated
*   Tutor has selected In-Person or Both as teaching mode

**Trigger:** Tutor configures service area during teaching mode setup or edits existing area

**Main Flow:**

1.  System displays map interface using OpenStreetMap/Leaflet
2.  Tutor enters their base location (address or postal code)
3.  System geocodes the location and places marker on map
4.  Tutor adjusts service radius using slider or input field
5.  System displays circular service area overlay on map
6.  Tutor confirms the service area
7.  System saves location (storing only postal code district for privacy) and radius
8.  System updates tutor's searchable location data

**Alternate Flows:**

*   **AF-4.8.1 (Invalid Address):** If address cannot be geocoded, system prompts tutor to enter valid UK address
*   **AF-4.8.2 (Radius Too Large):** If radius exceeds platform maximum, system caps at maximum and notifies tutor

**UC-4.9: Admin Accesses Platform Configuration**

**Use Case Name:** View and Modify Platform Settings

**Primary Actor:** Admin

**Secondary Actors:** System, Audit Log

**Preconditions:**

*   User is authenticated with Admin role
*   Admin has appropriate permissions

**Trigger:** Admin navigates to "Platform Settings" in Admin Panel

**Main Flow:**

1.  System displays current platform configuration
2.  Admin views configurable settings (commission rates, minimum rates, etc.)
3.  Admin modifies desired configuration values
4.  Admin saves changes
5.  System validates new values are within acceptable ranges
6.  System records change in Audit Log (Admin ID, setting changed, old value, new value, timestamp)
7.  System applies new configuration
8.  System displays confirmation of successful update

**Alternate Flows:**

*   **AF-4.9.1 (Invalid Value):** If configuration value is invalid, system rejects change and displays validation error
*   **AF-4.9.2 (Audit Log Failure):** If audit logging fails, system prevents configuration change and alerts Admin

**5\. Tutor Onboarding & Verification**

**5.1 Tutor Role Upgrade Flow**

*   **FR-5.1.1:** The system shall provide a “Become a Tutor” option on the Learner dashboard.
*   **FR-5.1.2:** Selecting “Become a Tutor” shall initiate the Tutor onboarding flow.
*   **FR-5.1.3:** Users must complete mandatory Tutor profile details, including subjects, rates, availability, and bio.
*   **FR-5.1.4:** Users must upload required qualification documents for verification.
*   **FR-5.1.5 (Role Activation):** Upon completion of the Tutor onboarding flow, the system shall assign the Tutor role to the user with an initial status of “Unverified Tutor”.
*   **FR-5.1.6 (Verification Status):** The Tutor profile shall remain unverified until Admin approval of submitted documents.
*   **FR-5.1.7 (Verified Badge):** Upon Admin approval of Tutor certificates/documents, the system shall mark the Tutor as “Verified” and display a Verified Badge on the Tutor’s public profile.

**5.2 Certificate Verification**

**FR-5.2.1:** Tutors must upload proof of qualifications (Degrees, Certifications, IDs).

*   **FR-5.2.2:** The system shall trigger a notification to the Admin upon document submission.
*   **FR-5.2.3:** The Admin shall have an interface to View, Approve, or Reject documents.

**FR-5.2.4:** Upon Admin approval, a "Verified Badge" shall be prominently displayed on the Tutor's public profile to build trust.

**Use Cases for Tutor Onboarding & Verification**

**UC-5.1: Learner Initiates Tutor Role Upgrade**

**Use Case Name:** Become a Tutor - Initiate Onboarding

**Primary Actor:** Learner

**Secondary Actors:** System

**Preconditions:**

*   User is registered and authenticated as a Learner
*   User does not already have Tutor role

**Trigger:** Learner clicks "Become a Tutor" option on their dashboard

**Main Flow:**

1.  System displays "Become a Tutor" option on Learner dashboard
2.  Learner clicks the option
3.  System presents overview of tutor requirements and benefits
4.  Learner confirms intention to proceed
5.  System initiates Tutor onboarding flow
6.  System redirects Learner to Tutor profile setup wizard

**Alternate Flows:**

*   **AF-5.1.1 (Already a Tutor):** If user already has Tutor role, system displays message "You are already registered as a Tutor" and redirects to Tutor dashboard
*   **AF-5.1.2 (Incomplete Learner Profile):** If Learner profile is incomplete, system prompts to complete basic profile before proceeding

**UC-5.2: Complete Tutor Onboarding Flow**

**Use Case Name:** Complete Mandatory Tutor Profile Setup

**Primary Actor:** Learner (transitioning to Tutor)

**Secondary Actors:** System

**Preconditions:**

*   User has initiated "Become a Tutor" process
*   User is in the onboarding wizard

**Trigger:** System displays tutor profile setup wizard after UC-5.1

**Main Flow:**

1.  System displays step-by-step onboarding wizard
2.  User enters subjects they will teach (multi-select from list)
3.  User sets hourly rates for each selected subject
4.  User configures availability schedule
5.  User writes professional bio and headline
6.  User adds education and experience details
7.  System validates all mandatory fields are completed
8.  System saves tutor profile data
9.  System assigns Tutor role to user with status "Unverified Tutor"
10.  System displays prompt to upload verification documents

**Alternate Flows:**

*   **AF-5.2.1 (Incomplete Step):** If user tries to proceed without completing mandatory fields, system highlights missing fields and prevents advancement
*   **AF-5.2.2 (Save and Continue Later):** User can save progress and return to complete onboarding later; system preserves partial data
*   **AF-5.2.3 (Cancel Onboarding):** User can cancel; system discards partial tutor data and returns user to Learner dashboard

**UC-5.3: Upload Qualification Documents**

**Use Case Name:** Submit Documents for Verification

**Primary Actor:** Tutor (Unverified)

**Secondary Actors:** System, Admin

**Preconditions:**

*   User has completed tutor onboarding flow
*   User has Tutor role with "Unverified" status

**Trigger:** Tutor accesses document upload section or is prompted after onboarding

**Main Flow:**

1.  System displays document upload interface
2.  Tutor selects document type (Degree, Certification, ID, Other)
3.  Tutor uploads document file (PDF, JPG, PNG accepted)
4.  System validates file type and size
5.  System stores document securely in S3 bucket with restricted access
6.  Tutor can upload additional documents as needed
7.  Tutor clicks "Submit for Review"
8.  System marks documents as "Pending Review"
9.  System triggers notification to Admin queue
10.  System confirms submission and displays expected review timeline

**Alternate Flows:**

*   **AF-5.3.1 (Invalid File Type):** If file type not supported, system displays error and accepted formats
*   **AF-5.3.2 (File Too Large):** If file exceeds size limit, system displays error with maximum size
*   **AF-5.3.3 (Upload Failure):** If upload fails, system displays retry option and logs error

**UC-5.4: Admin Reviews Verification Documents**

**Use Case Name:** Review and Process Tutor Documents

**Primary Actor:** Admin

**Secondary Actors:** System, Tutor, Email Service, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Documents are pending review in queue

**Trigger:** Admin accesses document verification queue or receives notification of new submission

**Main Flow:**

1.  System displays list of pending document verifications
2.  Admin selects a submission to review
3.  System displays Tutor information and uploaded documents
4.  Admin views each document using secure viewer
5.  Admin verifies document authenticity and relevance
6.  Admin clicks "Approve" for valid documents
7.  System updates Tutor status to "Verified"
8.  System adds "Verified Badge" to Tutor's public profile
9.  System sends approval notification email to Tutor
10.  System logs action in Audit Log (Admin ID, Tutor ID, Action: Approve, Timestamp)

**Alternate Flows:**

*   **AF-5.4.1 (Reject Documents):** Admin clicks "Reject" and provides reason; system notifies Tutor with rejection reason; Tutor remains "Unverified" and can resubmit
*   **AF-5.4.2 (Request Additional Documents):** Admin requests more documents; system notifies Tutor; status remains "Pending Additional Info"
*   **AF-5.4.3 (Document Cannot Be Viewed):** If document is corrupted, Admin marks as unreadable and requests re-upload

**UC-5.5: Tutor Receives Verification Decision**

**Use Case Name:** Receive Document Verification Outcome

**Primary Actor:** Tutor

**Secondary Actors:** System, Email Service

**Preconditions:**

*   Tutor has submitted documents for verification
*   Admin has processed the verification request

**Trigger:** Admin completes document review (approve or reject)

**Main Flow (Approval):**

1.  System updates Tutor verification status to "Verified"
2.  System adds Verified Badge to Tutor's public profile
3.  System sends email notification: "Congratulations! Your documents have been verified"
4.  System sends in-app notification
5.  Tutor's profile now appears in search results with Verified Badge
6.  Tutor can now receive booking requests

**Main Flow (Rejection):**

1.  System keeps Tutor status as "Unverified"
2.  System sends email notification with rejection reason
3.  System sends in-app notification with rejection details
4.  Tutor can review rejection reason in their dashboard
5.  System provides option to upload new/additional documents
6.  Tutor profile remains visible but without Verified Badge

**Alternate Flows:**

*   **AF-5.5.1 (Re-submission After Rejection):** Tutor uploads corrected documents; process returns to UC-5.3

**6\. Tutor Discovery & Browsing**

**6.1 Search and Filters**

*   **FR-6.1.1:** Learners can search for tutors by Subject or Keyword.
*   **FR-6.1.2:** Search results must be filterable by: Price Range, Minimum Rating, Availability, and Teaching Mode.

**6.2 Location-Based Discovery**

*   **FR-6.2.1:** The system shall integrate OpenStreetMap (Leaflet) to show tutors on a map view.
*   **FR-6.2.2:** For privacy, the map shall display the approximate location (e.g., postal code district) rather than the exact address.

**6.3 Profile Viewing**

*   **FR-6.3.1:** Learners can view a detailed Tutor Profile including Bio, Subjects, Verified Badge, and Reviews.

**Use Cases for Tutor Discovery & Browsing**

**UC-6.1: Search for Tutors by Subject**

**Use Case Name:** Search Tutors Using Subject or Keywords

**Primary Actor:** Learner (or Guest)

**Secondary Actors:** System

**Preconditions:**

*   User has access to the platform (logged in or as Guest)
*   At least one Tutor profile exists in the system

**Trigger:** User accesses the tutor search page or home page search bar

**Main Flow:**

1.  System displays search interface with input field
2.  User enters subject name or keyword (e.g., "Mathematics", "GCSE Physics")
3.  User clicks "Search" or presses Enter
4.  System queries database for tutors matching the search criteria
5.  System returns list of matching tutors sorted by relevance
6.  Each result displays: Tutor name, Profile picture, Headline, Subjects, Rating, Hourly rate, Verified Badge (if applicable)
7.  User can scroll through results or paginate

**Alternate Flows:**

*   **AF-6.1.1 (No Results):** If no tutors match search, system displays "No tutors found for \[search term\]" with suggestions to broaden search
*   **AF-6.1.2 (Empty Search):** If user searches with empty field, system returns all available tutors or prompts for input
*   **AF-6.1.3 (Guest User):** Guest can search but contact details and booking options are hidden; prompted to register

**UC-6.2: Filter Search Results**

**Use Case Name:** Apply Filters to Tutor Search

**Primary Actor:** Learner (or Guest)

**Secondary Actors:** System

**Preconditions:**

*   User has performed a search or is browsing tutors
*   Search results are displayed

**Trigger:** User clicks on filter options in the search interface

**Main Flow:**

1.  System displays filter panel alongside search results
2.  User selects Price Range using slider or inputs min/max values
3.  User selects Minimum Rating (e.g., 4+ stars)
4.  User selects Availability preference (specific days/times)
5.  User selects Teaching Mode (Online, In-Person, Both)
6.  User applies filters
7.  System re-queries results with applied filter criteria
8.  System displays filtered tutor list
9.  System shows active filters with option to clear each

**Alternate Flows:**

*   **AF-6.2.1 (No Matching Filters):** If no tutors match filter criteria, system displays message suggesting to adjust filters
*   **AF-6.2.2 (Clear Filters):** User clicks "Clear All Filters"; system resets to original search results
*   **AF-6.2.3 (Filter Combination):** Multiple filters are applied using AND logic; results must match all criteria

**UC-6.3: Browse Tutors on Map View**

**Use Case Name:** Discover Tutors Using Location-Based Map

**Primary Actor:** Learner

**Secondary Actors:** System, OpenStreetMap/Leaflet Service

**Preconditions:**

*   User is logged in as Learner
*   User is searching for In-Person tutoring

**Trigger:** User selects "Map View" option in search interface

**Main Flow:**

1.  System displays map interface using OpenStreetMap/Leaflet
2.  User can enter their location or allow browser geolocation
3.  System centers map on user's location
4.  System places markers for tutors offering In-Person services
5.  Each marker shows approximate location (postal code district, not exact address)
6.  User clicks on a marker
7.  System displays tutor card popup with: Name, Subjects, Rating, Distance
8.  User can click "View Profile" to see full details

**Alternate Flows:**

*   **AF-6.3.1 (Location Denied):** If user denies geolocation, system prompts for manual location entry
*   **AF-6.3.2 (No Local Tutors):** If no tutors in visible map area, system suggests zooming out or viewing online tutors
*   **AF-6.3.3 (Switch to List View):** User can switch back to list view at any time

**UC-6.4: View Detailed Tutor Profile**

**Use Case Name:** View Complete Tutor Information

**Primary Actor:** Learner (or Guest)

**Secondary Actors:** System

**Preconditions:**

*   Tutor profile exists and is active
*   User has found tutor via search, browse, or direct link

**Trigger:** User clicks on tutor card or "View Profile" button

**Main Flow:**

1.  System retrieves full tutor profile data
2.  System displays detailed profile page including:
    *   Profile photo and name
    *   Verified Badge (if verified)
    *   Professional headline
    *   Full bio/description
    *   Subjects offered with rates
    *   Education and experience
    *   Teaching modes available
    *   Availability overview
    *   Reviews and ratings section
    *   Average rating and total review count
3.  User can scroll through complete profile
4.  System displays "Book a Session" button (for logged-in Learners)
5.  System displays "Message" option (if booking exists or interest expressed)

**Alternate Flows:**

*   **AF-6.4.1 (Guest Viewing):** Guest can view profile but "Book" and "Message" buttons prompt registration
*   **AF-6.4.2 (Suspended Tutor):** If tutor is suspended, system displays "Profile unavailable" message
*   **AF-6.4.3 (Own Profile):** If Tutor views own profile, system displays edit options instead of booking

**7\. Learner Discovery (Reverse Browsing)**

**7.1 Learner Requests**

*   **FR-7.1.1:** Learners can post "Tuition Requests" specifying Subject, Budget, Mode, and Description.

**7.2 Tutor Interaction**

*   **FR-7.2.1:** Verified Tutors can browse active Learner Requests.
*   **FR-7.2.2:** Tutors can "Express Interest" in a request.
*   **FR-7.2.3:** Tutors cannot initiate direct chat; expressing interest notifies the Learner, who can then choose to initiate the conversation.

**Use Cases for Learner Discovery (Reverse Browsing)**

**UC-7.1: Learner Posts Tuition Request**

**Use Case Name:** Create and Publish Tuition Request

**Primary Actor:** Learner

**Secondary Actors:** System

**Preconditions:**

*   Learner is authenticated and logged in
*   Learner has completed basic profile

**Trigger:** Learner clicks "Post a Request" or "Find a Tutor" button

**Main Flow:**

1.  System displays tuition request form
2.  Learner selects Subject from dropdown or enters custom subject
3.  Learner specifies Budget (hourly rate range or total budget)
4.  Learner selects preferred Mode (Online, In-Person, Either)
5.  Learner writes Description explaining their learning goals and requirements
6.  Learner optionally specifies preferred schedule/availability
7.  Learner submits the request
8.  System validates all required fields are completed
9.  System publishes request to the active requests board
10.  System confirms request is live and visible to tutors

**Alternate Flows:**

*   **AF-7.1.1 (Required Field Missing):** If mandatory field is empty, system highlights field and prevents submission
*   **AF-7.1.2 (Edit Request):** Learner can edit active request; system updates listing
*   **AF-7.1.3 (Delete Request):** Learner can delete request; system removes from active listings

**UC-7.2: Tutor Browses Learner Requests**

**Use Case Name:** View Available Tuition Requests

**Primary Actor:** Tutor (Verified)

**Secondary Actors:** System

**Preconditions:**

*   Tutor is authenticated with Verified status
*   Active learner requests exist in the system

**Trigger:** Tutor navigates to "Browse Requests" or "Find Students" section

**Main Flow:**

1.  System displays list of active tuition requests
2.  Each request shows: Subject, Budget range, Mode preference, Brief description
3.  Tutor can filter requests by Subject, Mode, or Budget range
4.  Tutor can sort by newest, budget, or relevance to their subjects
5.  Tutor clicks on a request to view full details
6.  System displays complete request information
7.  System shows "Express Interest" button

**Alternate Flows:**

*   **AF-7.2.1 (Unverified Tutor):** If Tutor is unverified, system displays requests but disables "Express Interest" with message to complete verification
*   **AF-7.2.2 (No Matching Requests):** If no requests match tutor's subjects, system suggests checking back later or adjusting subject offerings

**UC-7.3: Tutor Expresses Interest in Request**

**Use Case Name:** Express Interest in Learner Request

**Primary Actor:** Tutor (Verified)

**Secondary Actors:** System, Learner, Notification Service

**Preconditions:**

*   Tutor is verified and authenticated
*   Tutor is viewing a learner's tuition request
*   Tutor has not already expressed interest in this request

**Trigger:** Tutor clicks "Express Interest" button on a request

**Main Flow:**

1.  Tutor views full request details
2.  Tutor clicks "Express Interest" button
3.  System records the interest expression
4.  System sends notification to the Learner (in-app and/or email)
5.  Notification includes: Tutor name, Subjects they teach, Rating, Verified badge
6.  System confirms to Tutor that interest has been expressed
7.  System updates request to show Tutor has expressed interest
8.  Tutor waits for Learner to initiate contact

**Alternate Flows:**

*   **AF-7.3.1 (Already Expressed Interest):** If Tutor has already expressed interest, button shows "Interest Sent" and is disabled
*   **AF-7.3.2 (Request Closed):** If request was closed/deleted while viewing, system displays message and returns to request list
*   **AF-7.3.3 (Withdraw Interest):** Tutor can withdraw interest; system removes their expression and notifies Learner

**UC-7.4: Learner Reviews Interested Tutors**

**Use Case Name:** Review and Respond to Tutor Interest

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor

**Preconditions:**

*   Learner has an active tuition request
*   At least one Tutor has expressed interest

**Trigger:** Learner receives notification of tutor interest or checks their request

**Main Flow:**

1.  Learner receives notification that a Tutor expressed interest
2.  Learner navigates to their active request
3.  System displays list of Tutors who have expressed interest
4.  For each Tutor, system shows: Name, Profile photo, Subjects, Rating, Verified badge, Hourly rate
5.  Learner can click to view full Tutor profile
6.  Learner decides to initiate conversation with a Tutor
7.  Learner clicks "Message" or "Start Chat" for chosen Tutor
8.  System enables chat channel between Learner and Tutor
9.  Learner can now discuss requirements and potentially book a session

**Alternate Flows:**

*   **AF-7.4.1 (No Interest Yet):** If no tutors have expressed interest, system displays message "No tutors have responded yet"
*   **AF-7.4.2 (Ignore Interest):** Learner can ignore tutor interest; no action required
*   **AF-7.4.3 (Close Request):** Learner can close request after finding suitable tutor; system notifies other interested tutors

**8\. Booking & Scheduling**

**8.1 Session Booking**

*   **FR-8.1.1:** Bookings must be initiated through the platform to prevent off-platform leakage.
*   **FR-8.1.2:** Learners select a specific time slot from the Tutor’s Availability Calendar.
*   **FR-8.1.3:** The system supports both one-off sessions and recurring bookings.

**8.2 Booking Lifecycle & Completion Logic (Updated)**

*   **FR-8.2.1 Pending:** Booking request sent to Tutor.
*   **FR-8.2.2 Confirmed:** Tutor accepts the request AND payment is secured.
*   **FR-8.2.3 Completed (Auto-Confirmation):** By default, a session is marked "Completed" 24 hours after the scheduled end time unless a dispute is raised.
*   **FR-8.2.4 Completed (Manual):** Learners can manually mark a session as "Completed" immediately after it ends.
*   **FR-8.2.5 Offline Proof:** For in-person sessions, the system shall provide a "Check-in" feature where the Tutor clicks "Start Session" and the Learner must acknowledge via a prompt/OTP on their device to validate the session occurred.
*   **FR-8.2.6 Cancelled:** Either party cancels (subject to cancellation rules).

**Use Cases for Booking & Scheduling**

**UC-8.1: Learner Books a Session**

**Use Case Name:** Book a Tutoring Session

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor, Payment Gateway

**Preconditions:**

*   Learner is authenticated
*   Learner has viewed a Tutor's profile
*   Tutor has available time slots

**Trigger:** Learner clicks "Book a Session" on Tutor's profile

**Main Flow:**

1.  Learner clicks "Book a Session" button on Tutor profile
2.  System displays Tutor's availability calendar
3.  Learner selects a subject from Tutor's offerings
4.  Learner selects an available date and time slot
5.  Learner selects session duration (e.g., 1 hour, 2 hours)
6.  System calculates total cost based on hourly rate and duration
7.  System displays booking summary (Tutor, Subject, Date/Time, Duration, Cost)
8.  Learner confirms booking details
9.  System redirects to payment (see UC-9.1)
10.  Upon successful payment, system creates booking with "Pending" status
11.  System sends booking request notification to Tutor
12.  System confirms booking request sent to Learner

**Alternate Flows:**

*   **AF-8.1.1 (No Available Slots):** If no slots available, system displays message and suggests Learner contact Tutor or check back later
*   **AF-8.1.2 (Slot Taken):** If selected slot becomes unavailable during booking, system alerts Learner to select different slot
*   **AF-8.1.3 (Payment Fails):** If payment fails, booking is not created; Learner prompted to retry

**UC-8.2: Learner Books Recurring Sessions**

**Use Case Name:** Schedule Recurring Tutoring Sessions

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor, Payment Gateway

**Preconditions:**

*   Learner is authenticated
*   Tutor offers recurring booking option
*   Tutor has recurring availability

**Trigger:** Learner selects "Recurring Booking" option during booking flow

**Main Flow:**

1.  Learner initiates booking and selects "Recurring" option
2.  System displays recurring scheduling options
3.  Learner selects frequency (weekly, bi-weekly)
4.  Learner selects preferred day and time
5.  Learner specifies number of sessions or end date
6.  System checks Tutor availability for all proposed sessions
7.  System calculates total cost for all sessions
8.  System displays booking summary with all session dates
9.  Learner confirms and proceeds to payment
10.  Upon payment, system creates multiple bookings with "Pending" status
11.  System notifies Tutor of recurring booking request

**Alternate Flows:**

*   **AF-8.2.1 (Partial Availability):** If Tutor unavailable for some dates, system shows conflicts and allows Learner to adjust or proceed with available dates only
*   **AF-8.2.2 (Cancel Recurring):** Learner can cancel future recurring sessions; past sessions unaffected

**UC-8.3: Tutor Accepts Booking Request**

**Use Case Name:** Confirm or Decline Booking Request

**Primary Actor:** Tutor

**Secondary Actors:** System, Learner, Notification Service

**Preconditions:**

*   Tutor is authenticated
*   Tutor has pending booking request(s)
*   Payment for booking has been secured

**Trigger:** Tutor receives notification of new booking request or views pending bookings

**Main Flow:**

1.  Tutor receives notification of booking request
2.  Tutor navigates to "Pending Bookings" section
3.  System displays booking details: Learner name, Subject, Date/Time, Duration
4.  Tutor reviews the booking request
5.  Tutor clicks "Accept" to confirm the booking
6.  System updates booking status from "Pending" to "Confirmed"
7.  System sends confirmation notification to Learner
8.  Session is added to both parties' calendars
9.  Chat is enabled between Tutor and Learner

**Alternate Flows:**

*   **AF-8.3.1 (Decline Booking):** Tutor clicks "Decline" and optionally provides reason; system updates status to "Declined"; payment is released back to Learner; Learner is notified
*   **AF-8.3.2 (Request More Info):** Tutor can message Learner before accepting to clarify requirements
*   **AF-8.3.3 (Auto-Decline):** If Tutor doesn't respond within X hours, system can auto-decline and notify both parties

**UC-8.4: Session Auto-Completion**

**Use Case Name:** Automatic Session Completion After 24 Hours

**Primary Actor:** System

**Secondary Actors:** Tutor, Learner, Payment Service

**Preconditions:**

*   Booking status is "Confirmed"
*   Scheduled session end time has passed

**Trigger:** System timer detects 24 hours have elapsed since session end time

**Main Flow:**

1.  System identifies confirmed sessions where end time + 24 hours has passed
2.  System checks if any dispute has been raised for the session
3.  If no dispute, system automatically updates status to "Completed"
4.  System triggers payout process (funds released from escrow to Tutor)
5.  System sends completion notification to both parties
6.  System prompts Learner to leave a review

**Alternate Flows:**

*   **AF-8.4.1 (Dispute Raised):** If dispute was raised within 24 hours, auto-completion is blocked; status remains "Under Dispute"
*   **AF-8.4.2 (Already Manually Completed):** If Learner already marked complete, no action needed

**UC-8.5: Learner Manually Completes Session**

**Use Case Name:** Mark Session as Completed Immediately

**Primary Actor:** Learner

**Secondary Actors:** System, Payment Service

**Preconditions:**

*   Booking status is "Confirmed"
*   Session has ended (current time is after scheduled end time)

**Trigger:** Learner clicks "Mark as Completed" on their booking

**Main Flow:**

1.  Session end time arrives or has passed
2.  Learner navigates to the booking
3.  System displays "Mark as Completed" button
4.  Learner clicks the button
5.  System prompts for confirmation: "Are you sure the session is complete?"
6.  Learner confirms
7.  System updates booking status to "Completed"
8.  System initiates fund release process (after standard hold period)
9.  System prompts Learner to leave a review
10.  System notifies Tutor that session was marked complete

**Alternate Flows:**

*   **AF-8.5.1 (Session Not Started):** If session hasn't started yet, "Mark as Completed" is not available
*   **AF-8.5.2 (Already Completed):** If already completed, button is disabled

**UC-8.6: In-Person Session Check-In**

**Use Case Name:** Validate In-Person Session Occurrence

**Primary Actor:** Tutor

**Secondary Actors:** Learner, System

**Preconditions:**

*   Booking is for In-Person session
*   Booking status is "Confirmed"
*   Session time has arrived

**Trigger:** Tutor clicks "Start Session" at beginning of in-person session

**Main Flow:**

1.  Session scheduled time arrives
2.  Tutor opens the booking in the app
3.  Tutor clicks "Start Session" button
4.  System generates unique OTP or verification prompt
5.  System sends notification/prompt to Learner's device
6.  Learner receives notification: "Confirm session has started"
7.  Learner acknowledges by entering OTP or clicking confirm
8.  System records check-in timestamp
9.  System displays "Session in Progress" status to both parties
10.  This validation serves as proof that the session occurred

**Alternate Flows:**

*   **AF-8.6.1 (Learner Doesn't Confirm):** If Learner doesn't acknowledge within X minutes, Tutor can resend prompt; if no response, this is noted but session can proceed
*   **AF-8.6.2 (Technical Issue):** If either party has technical issue with check-in, they can note it and proceed; evidence available for dispute if needed
*   **AF-8.6.3 (Online Session):** For online sessions, check-in may integrate with video call start time

**UC-8.7: Cancel Booking**

**Use Case Name:** Cancel a Scheduled Session

**Primary Actor:** Learner or Tutor

**Secondary Actors:** System, Payment Service, Other Party

**Preconditions:**

*   Booking exists with status "Pending" or "Confirmed"
*   Cancellation is within allowed cancellation window

**Trigger:** User clicks "Cancel Booking" on an upcoming session

**Main Flow:**

1.  User navigates to their booking
2.  User clicks "Cancel Booking" button
3.  System displays cancellation policy and any applicable fees
4.  System prompts for cancellation reason (optional)
5.  User confirms cancellation
6.  System updates booking status to "Cancelled"
7.  System applies cancellation policy rules:
    *   Early cancellation (e.g., 24+ hours): Full refund to Learner
    *   Late cancellation (e.g., <24 hours): Partial refund based on policy
8.  System processes any refund due
9.  System notifies the other party of cancellation
10.  Time slot returns to Tutor's availability

**Alternate Flows:**

*   **AF-8.7.1 (No Refund Period):** If cancelled very close to session time, system displays "No refund available" warning
*   **AF-8.7.2 (Tutor Cancellation):** If Tutor cancels, Learner receives full refund regardless of timing; Tutor may receive warning/penalty for repeated cancellations
*   **AF-8.7.3 (Pending Booking):** If booking was pending (not yet accepted), cancellation returns full payment; no penalty

**9\. Payment, Revenue & Dispute Management**

**9.1 Payment Processing**

**FR-9.1.1:** The system shall integrate a secure Payment Gateway (e.g., Stripe).

*   **FR-9.1.2:** Learners must pay upfront to confirm a booking.

**9.2 Escrow & Commission**

*   **FR-9.2.1:** Payments are held in an "Escrow" state until the session is successfully completed (see FR-8.2.3).

**FR-9.2.2:** The system automatically deducts a platform commission (X%) before transferring the remaining balance to the Tutor’s wallet.

*   **FR-9.2.3:** Funds are released to the Tutor's withdrawable balance 24 hours after session completion.

**9.3 Invoicing**

*   **FR-9.3.1:** Automated receipt generation for Learners and commission invoices for Tutors.

**9.4 Dispute Resolution Flow (New)**

*   **FR-9.4.1 (Dispute Window):** Learners shall have the ability to raise a "Dispute" button on a past booking within 24 hours of the session end time.
*   **FR-9.4.2 (Escrow Freeze):** Raising a dispute immediately pauses the release of funds from Escrow to the Tutor.
*   **FR-9.4.3 (Evidence):** The Dispute interface shall require the Learner to select a reason (e.g., "Tutor No-Show," "Poor Quality") and allow text description/file uploads as evidence.
*   **FR-9.4.4 (Admin Resolution):** Admins shall have options to resolve the dispute by:
*   **Full Refund:** Funds returned to Learner.
*   **Release Payment:** Funds released to Tutor (claim rejected).
*   **Partial Refund:** Split amount between Learner and Tutor.

**Use Cases for Payment, Revenue & Dispute Management**

**UC-9.1: Learner Makes Payment for Booking**

**Use Case Name:** Process Upfront Payment for Session

**Primary Actor:** Learner

**Secondary Actors:** System, Payment Gateway (Stripe)

**Preconditions:**

*   Learner is authenticated
*   Learner has selected session details and is in checkout
*   Learner has valid payment method

**Trigger:** Learner confirms booking and proceeds to payment

**Main Flow:**

1.  System displays payment page with session summary and total amount
2.  Learner enters payment details or selects saved payment method
3.  Learner reviews payment amount and clicks "Pay Now"
4.  System sends payment request to Stripe API
5.  Stripe processes the payment
6.  Stripe returns success confirmation
7.  System records payment and associates with booking
8.  System places payment in "Escrow" status
9.  System creates booking with "Pending" status
10.  System displays payment confirmation to Learner
11.  System sends payment receipt via email

**Alternate Flows:**

*   **AF-9.1.1 (Payment Declined):** If card is declined, system displays error message; Learner can retry with different payment method
*   **AF-9.1.2 (3D Secure Required):** If additional authentication needed, system redirects to bank's authentication page; resumes after success
*   **AF-9.1.3 (Gateway Timeout):** If Stripe times out, system displays error and prompts to retry; no charge is made
*   **AF-9.1.4 (Duplicate Payment Prevention):** System prevents duplicate submissions during processing

**UC-9.2: System Holds Payment in Escrow**

**Use Case Name:** Secure Funds in Escrow Until Session Completion

**Primary Actor:** System

**Secondary Actors:** Payment Gateway, Tutor, Learner

**Preconditions:**

*   Payment has been successfully processed
*   Booking has been created

**Trigger:** Successful payment confirmation from payment gateway

**Main Flow:**

1.  System receives payment confirmation from Stripe
2.  System marks payment status as "In Escrow"
3.  Funds are held (not transferred to Tutor) pending session outcome
4.  System associates escrow record with booking ID
5.  System displays "Payment Secured" status on booking for both parties
6.  Escrow remains until session completion or dispute resolution

**Alternate Flows:**

*   **AF-9.2.1 (Booking Declined):** If Tutor declines booking, system initiates full refund from escrow
*   **AF-9.2.2 (Booking Cancelled Early):** If cancelled within refund window, system initiates refund from escrow

**UC-9.3: System Releases Payment to Tutor**

**Use Case Name:** Release Escrow Funds After Session Completion

**Primary Actor:** System

**Secondary Actors:** Payment Gateway, Tutor

**Preconditions:**

*   Session has been marked as "Completed"
*   No active dispute exists for the session
*   24-hour hold period has passed (if applicable)

**Trigger:** Session status changes to "Completed" and hold period expires

**Main Flow:**

1.  System identifies completed sessions with funds ready for release
2.  System calculates platform commission (X% of session fee)
3.  System calculates Tutor payout (session fee minus commission)
4.  System updates Tutor's withdrawable balance
5.  System records commission as platform revenue
6.  System updates payment status from "Escrow" to "Released"
7.  System sends notification to Tutor: "Payment for session with \[Learner\] has been added to your balance"
8.  Funds are available for Tutor withdrawal

**Alternate Flows:**

*   **AF-9.3.1 (Dispute Active):** If dispute is raised, funds remain in escrow until Admin resolves dispute
*   **AF-9.3.2 (Payout Calculation Error):** If calculation fails, system logs error and alerts Admin for manual review

**UC-9.4: Generate Invoice and Receipt**

**Use Case Name:** Automated Financial Document Generation

**Primary Actor:** System

**Secondary Actors:** Learner, Tutor, Email Service

**Preconditions:**

*   Payment has been processed
*   Session has been completed

**Trigger:** Payment is processed (for Learner receipt) or session is completed (for Tutor invoice)

**Main Flow (Learner Receipt):**

1.  System generates receipt upon successful payment
2.  Receipt includes: Learner name, Tutor name, Session details, Amount paid, Date, Transaction ID
3.  System sends receipt via email to Learner
4.  Receipt is also available in Learner's transaction history

**Main Flow (Tutor Commission Invoice):**

1.  System generates invoice when payment is released
2.  Invoice includes: Session details, Gross amount, Commission amount, Net payout, Date
3.  System sends invoice via email to Tutor
4.  Invoice is also available in Tutor's financial dashboard

**Alternate Flows:**

*   **AF-9.4.1 (Email Delivery Failure):** If email fails, system retries; documents remain accessible in dashboard
*   **AF-9.4.2 (Partial Refund):** If partial refund was issued, documents reflect adjusted amounts

**UC-9.5: Learner Raises Dispute**

**Use Case Name:** Initiate Dispute for Completed Session

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor, Admin

**Preconditions:**

*   Session has ended
*   Less than 24 hours have passed since session end time
*   Session status is not already "Disputed"

**Trigger:** Learner clicks "Raise Dispute" button on booking

**Main Flow:**

1.  Learner navigates to recently ended session
2.  System displays "Raise Dispute" button (visible within 24-hour window)
3.  Learner clicks the button
4.  System displays dispute form
5.  Learner selects dispute reason from dropdown:
    *   "Tutor No-Show"
    *   "Poor Quality Session"
    *   "Session Ended Early"
    *   "Other"
6.  Learner enters detailed description of the issue
7.  Learner optionally uploads evidence (screenshots, files)
8.  Learner submits dispute
9.  System immediately pauses escrow fund release
10.  System updates booking status to "Under Dispute"
11.  System notifies Tutor that dispute has been raised
12.  System creates dispute ticket for Admin review
13.  System confirms to Learner that dispute has been submitted

**Alternate Flows:**

*   **AF-9.5.1 (Dispute Window Expired):** If more than 24 hours passed, "Raise Dispute" button is hidden; Learner can contact support for exceptional cases
*   **AF-9.5.2 (Funds Already Released):** If payment was already released, system notifies Learner to contact Admin for manual review

**UC-9.6: Admin Resolves Dispute**

**Use Case Name:** Review and Resolve Payment Dispute

**Primary Actor:** Admin

**Secondary Actors:** System, Learner, Tutor, Payment Gateway, Audit Log

**Preconditions:**

*   Dispute has been raised
*   Admin is authenticated
*   Escrow funds are frozen

**Trigger:** Admin accesses dispute queue or receives dispute notification

**Main Flow:**

1.  Admin navigates to Dispute Management in Admin Panel
2.  System displays list of open disputes
3.  Admin selects a dispute to review
4.  System displays:
    *   Booking details (Tutor, Learner, Subject, Date/Time)
    *   Dispute reason and Learner's description
    *   Evidence uploaded by Learner
    *   Chat history between Tutor and Learner
    *   Session check-in data (if In-Person)
5.  Admin reviews all evidence
6.  Admin may contact either party for additional information
7.  Admin selects resolution:
    *   **Full Refund:** Return 100% to Learner
    *   **Release Payment:** Transfer to Tutor (dispute rejected)
    *   **Partial Refund:** Split between parties (Admin specifies amounts)
8.  Admin enters resolution notes
9.  Admin confirms resolution
10.  System executes the financial resolution
11.  System updates booking status to "Dispute Resolved"
12.  System notifies both parties of the outcome
13.  System logs action in Audit Log (Admin ID, Dispute ID, Resolution, Timestamp)

**Alternate Flows:**

*   **AF-9.6.1 (Escalation Needed):** If Admin cannot resolve, can escalate to senior Admin
*   **AF-9.6.2 (Additional Evidence Requested):** Admin requests more evidence from either party; dispute remains open
*   **AF-9.6.3 (Refund Processing Failure):** If refund fails, system alerts Admin; manual intervention required

**10\. Chat & Communication**

**10.1 Access Control**

*   **FR-10.1.1:** Critical: Chat functionality is enabled only after a booking is confirmed and paid for (or Learner initiates after Tutor expresses interest).

**10.2 Features**

*   **FR-10.2.1:** Real-time messaging using WebSockets.
*   **FR-10.2.2:** The system persists message history for dispute resolution.
*   **FR-10.2.3:** The interface shall warn users against sharing personal phone numbers or emails.

**10.3 Admin Conversation Oversight (New)**

*   **FR-10.3.1 (Read-Only Access):** The system shall allow Admin users to view chat conversations between any Tutor and Learner in a read-only mode.
*   **FR-10.3.2 (Integrity):** Admins shall **not** be able to send, edit, or delete messages within user conversations.
*   **FR-10.3.3 (Metadata):** The Admin chat view shall display: Tutor name/link, Learner name/link, Associated booking ID, and Timestamped message history.
*   **FR-10.3.4 (Search & Filter):** Admins shall be able to search and filter conversations by Tutor, Learner, Booking ID, or Date range.
*   **FR-10.3.5 (Safety Flagging):** The system shall automatically flag conversations containing suspicious keywords (e.g., phone numbers, email IDs, "Zoom link", "pay cash") for Admin review to prevent platform leakage.

**Use Cases for Chat & Communication**

**UC-10.1: Initiate Chat After Booking Confirmation**

**Use Case Name:** Start Conversation After Booking is Confirmed

**Primary Actor:** Learner or Tutor

**Secondary Actors:** System, Other Party

**Preconditions:**

*   Booking exists between Learner and Tutor
*   Booking status is "Confirmed" (payment secured and Tutor accepted)

**Trigger:** Either party clicks "Message" button on confirmed booking

**Main Flow:**

1.  Tutor accepts booking request
2.  System updates booking to "Confirmed" status
3.  System automatically enables chat channel between Learner and Tutor
4.  System displays "Message" button in booking details for both parties
5.  Either party clicks "Message" button
6.  System opens chat interface
7.  User composes and sends message
8.  System delivers message in real-time via WebSocket
9.  Recipient receives instant notification
10.  System persists message in chat history

**Alternate Flows:**

*   **AF-10.1.1 (Chat Before Confirmation):** If booking is only "Pending", "Message" button is disabled with tooltip "Chat available after tutor confirms"
*   **AF-10.1.2 (Offline Recipient):** If recipient is offline, message is stored; notification sent; recipient sees on next login

**UC-10.2: Learner Initiates Chat After Tutor Interest**

**Use Case Name:** Start Conversation with Interested Tutor

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor

**Preconditions:**

*   Learner has posted a tuition request
*   Tutor has expressed interest in the request

**Trigger:** Learner clicks "Message" on a Tutor who expressed interest

**Main Flow:**

1.  Tutor expresses interest in Learner's tuition request
2.  System notifies Learner of interest
3.  Learner views list of interested Tutors
4.  Learner clicks "Message" button next to chosen Tutor
5.  System creates chat channel between Learner and Tutor
6.  System opens chat interface
7.  Learner sends initial message
8.  System delivers message in real-time
9.  Tutor receives notification
10.  Chat history is persisted for both parties

**Alternate Flows:**

*   **AF-10.2.1 (Tutor Cannot Initiate):** Tutor cannot send first message; must wait for Learner to initiate
*   **AF-10.2.2 (Request Closed):** If Learner closed the request, chat option may be limited or conversation archived

**UC-10.3: Real-Time Messaging**

**Use Case Name:** Send and Receive Messages in Real-Time

**Primary Actor:** Learner or Tutor

**Secondary Actors:** System (WebSocket), Other Party

**Preconditions:**

*   Chat channel exists between parties
*   Both users are authenticated
*   At least one user is online

**Trigger:** User types and sends a message

**Main Flow:**

1.  User opens chat conversation
2.  System loads message history
3.  User types message in input field
4.  User clicks "Send" or presses Enter
5.  System transmits message via WebSocket connection
6.  System stores message in database with timestamp
7.  If recipient is online, message appears instantly
8.  System updates conversation list with latest message
9.  System shows delivery/read indicators (if implemented)

**Alternate Flows:**

*   **AF-10.3.1 (Connection Lost):** If WebSocket disconnects, system attempts reconnection; queues messages; delivers when connection restored
*   **AF-10.3.2 (Recipient Offline):** Message stored; push notification sent; delivered when recipient reconnects
*   **AF-10.3.3 (Long Message):** If message exceeds character limit, system truncates or warns user

**UC-10.4: View Chat History**

**Use Case Name:** Access Previous Conversation Messages

**Primary Actor:** Learner or Tutor

**Secondary Actors:** System

**Preconditions:**

*   User is authenticated
*   Chat history exists with at least one other party

**Trigger:** User navigates to Messages or Chat section

**Main Flow:**

1.  User clicks "Messages" in navigation
2.  System retrieves list of all conversations for the user
3.  System displays conversation list sorted by most recent activity
4.  Each entry shows: Other party's name, Last message preview, Timestamp, Unread indicator
5.  User clicks on a conversation
6.  System loads full message history
7.  Messages display with sender, content, and timestamp
8.  User can scroll through historical messages
9.  System marks unread messages as read

**Alternate Flows:**

*   **AF-10.4.1 (No Conversations):** If user has no chats, system displays "No messages yet" with guidance on how to start
*   **AF-10.4.2 (Pagination):** For long conversations, system loads messages in batches as user scrolls up

**UC-10.5: System Displays Contact Sharing Warning**

**Use Case Name:** Warn Users Against Sharing Personal Contact Details

**Primary Actor:** System

**Secondary Actors:** User (Learner or Tutor)

**Preconditions:**

*   Chat interface is active
*   User is composing a message

**Trigger:** User opens chat or sends message containing personal contact patterns

**Main Flow:**

1.  System displays persistent notice in chat interface: "For your safety, please keep all communication on the platform. Sharing personal phone numbers or emails may result in account restrictions."
2.  User types message
3.  System scans message content for suspicious patterns (phone numbers, emails, external links)
4.  If detected, system displays warning before sending: "Your message appears to contain personal contact information. Sharing this may violate our terms of service."
5.  User can choose to edit message or proceed
6.  Message is sent (but flagged for Admin review)

**Alternate Flows:**

*   **AF-10.5.1 (False Positive):** If pattern detection triggers incorrectly, user can still send; message may be manually reviewed
*   **AF-10.5.2 (Repeated Violations):** If user repeatedly shares contact info, system may escalate to Admin for review

**UC-10.6: Admin Views User Conversations (Read-Only)**

**Use Case Name:** Admin Reviews Chat for Support or Dispute

**Primary Actor:** Admin

**Secondary Actors:** System, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Valid reason exists (dispute, reported conversation, flagged content)

**Trigger:** Admin accesses conversation oversight feature

**Main Flow:**

1.  Admin navigates to "Chat Oversight" in Admin Panel
2.  System displays search/filter interface
3.  Admin searches by: Tutor name, Learner name, Booking ID, or Date range
4.  System returns matching conversations
5.  Admin selects a conversation to review
6.  System displays chat history in read-only mode
7.  System shows metadata: Tutor name/link, Learner name/link, Associated booking ID, Timestamps
8.  Admin reviews messages
9.  System logs Admin access (Admin ID, Conversation ID, Timestamp, IP Address)
10.  Admin can take action if policy violation found (warn user, escalate, etc.)

**Alternate Flows:**

*   **AF-10.6.1 (Admin Cannot Modify):** Admin has no ability to send, edit, or delete messages; interface is strictly read-only
*   **AF-10.6.2 (No Results):** If search returns no conversations, system displays message

**UC-10.7: System Flags Suspicious Conversations**

**Use Case Name:** Automatic Detection of Platform Leakage Attempts

**Primary Actor:** System

**Secondary Actors:** Admin

**Preconditions:**

*   Chat messages are being sent between users
*   Keyword detection is configured

**Trigger:** Message is sent containing flagged keywords

**Main Flow:**

1.  User sends message in chat
2.  System stores message in database
3.  System scans message against suspicious keyword list:
    *   Phone number patterns
    *   Email patterns
    *   "Zoom link", "Google Meet", "Skype"
    *   "Pay cash", "Pay directly", "Outside the app"
    *   Other configured terms
4.  If keyword detected, system flags the conversation
5.  System adds conversation to Admin review queue
6.  System sends alert to Admin dashboard
7.  Message is still delivered (not blocked)
8.  Admin can review flagged conversation at their discretion

**Alternate Flows:**

*   **AF-10.7.1 (High Severity Flag):** For certain high-risk keywords, system may require immediate Admin review
*   **AF-10.7.2 (False Positive Dismissal):** Admin can dismiss flag if determined to be false positive

**11\. Reviews & Ratings**

**11.1 Feedback Mechanism**

**FR-11.1.1:** Learners are prompted to leave a review (Text) and Rating (1-5 Stars) after a session acts as "Completed".

*   **FR-11.1.2:** Tutors cannot delete reviews but can report them to Admin for moderation.

**11.2 Display**

*   **FR-11.2.1:** Average rating and review count are displayed on the Tutor Card and Profile.

**Use Cases for Reviews & Ratings**

**UC-11.1: Learner Submits Review After Session**

**Use Case Name:** Leave Review and Rating for Completed Session

**Primary Actor:** Learner

**Secondary Actors:** System, Tutor

**Preconditions:**

*   Session has been marked as "Completed"
*   Learner has not already reviewed this session

**Trigger:** Session is marked complete OR Learner clicks "Leave Review" on completed booking

**Main Flow:**

1.  Session status changes to "Completed"
2.  System prompts Learner with "Rate your session with \[Tutor Name\]"
3.  Learner clicks to open review form
4.  System displays review interface
5.  Learner selects star rating (1-5 stars)
6.  Learner writes text review (optional but encouraged)
7.  Learner clicks "Submit Review"
8.  System validates rating is selected
9.  System saves review to database
10.  System updates Tutor's average rating
11.  System displays review on Tutor's public profile
12.  System notifies Tutor that a new review was received

**Alternate Flows:**

*   **AF-11.1.1 (Skip Review):** Learner can dismiss prompt; system may remind later
*   **AF-11.1.2 (Rating Only):** If Learner submits only stars without text, system accepts but encourages detailed feedback
*   **AF-11.1.3 (Already Reviewed):** If Learner has reviewed this session, "Leave Review" button is disabled

**UC-11.2: View Reviews on Tutor Profile**

**Use Case Name:** Browse Tutor Reviews and Ratings

**Primary Actor:** Learner (or Guest)

**Secondary Actors:** System

**Preconditions:**

*   Tutor profile exists
*   Tutor has at least one review (for display)

**Trigger:** User views Tutor profile page

**Main Flow:**

1.  User navigates to Tutor's public profile
2.  System retrieves Tutor's reviews and ratings
3.  System calculates and displays:
    *   Average rating (e.g., 4.8 stars)
    *   Total review count (e.g., "47 reviews")
4.  System displays recent reviews with:
    *   Learner's display name (or anonymous option)
    *   Star rating given
    *   Text review content
    *   Date of review
5.  User can scroll through or paginate reviews
6.  User can sort reviews (Most Recent, Highest Rated, Lowest Rated)

**Alternate Flows:**

*   **AF-11.2.1 (No Reviews):** If Tutor has no reviews, system displays "No reviews yet" with encouragement to be the first
*   **AF-11.2.2 (New Tutor):** New Tutors display "New" badge instead of rating until minimum reviews threshold

**UC-11.3: Tutor Reports Inappropriate Review**

**Use Case Name:** Flag Review for Admin Moderation

**Primary Actor:** Tutor

**Secondary Actors:** System, Admin

**Preconditions:**

*   Tutor has received at least one review
*   Review in question is visible on Tutor's profile

**Trigger:** Tutor clicks "Report" button on a review

**Main Flow:**

1.  Tutor views their reviews in dashboard
2.  Tutor identifies a review they believe is inappropriate/false
3.  Tutor clicks "Report" button next to the review
4.  System displays report form
5.  Tutor selects reason for report:
    *   "False/Inaccurate Information"
    *   "Offensive Language"
    *   "Not Related to Session"
    *   "Other"
6.  Tutor provides additional details (optional)
7.  Tutor submits report
8.  System marks review as "Under Review" (still visible)
9.  System creates moderation ticket for Admin
10.  System confirms report submitted to Tutor

**Alternate Flows:**

*   **AF-11.3.1 (Tutor Cannot Delete):** Tutor has no option to delete reviews; only report for moderation
*   **AF-11.3.2 (Already Reported):** If review was already reported, system indicates "Report pending review"

**UC-11.4: Admin Moderates Reported Review**

**Use Case Name:** Review and Action on Reported Content

**Primary Actor:** Admin

**Secondary Actors:** System, Tutor, Learner

**Preconditions:**

*   A review has been reported
*   Admin is authenticated

**Trigger:** Admin accesses review moderation queue

**Main Flow:**

1.  Admin navigates to "Review Moderation" in Admin Panel
2.  System displays list of reported reviews
3.  Admin selects a reported review to examine
4.  System displays:
    *   Original review content and rating
    *   Booking/session details
    *   Tutor's report reason and comments
    *   Learner who wrote the review
5.  Admin evaluates whether review violates policies
6.  Admin decides:
    *   **Keep Review:** Review remains visible; report dismissed
    *   **Remove Review:** Review is hidden from public profile
    *   **Edit Review:** Admin redacts offensive portions (rare)
7.  Admin confirms decision
8.  System updates review visibility
9.  System notifies Tutor of outcome
10.  System logs action in Audit Log

**Alternate Flows:**

*   **AF-11.4.1 (Warning to Reviewer):** If Learner violated terms, Admin can issue warning
*   **AF-11.4.2 (Request More Information):** Admin can request clarification from either party before deciding

**UC-11.5: Display Rating on Tutor Cards**

**Use Case Name:** Show Aggregated Rating in Search Results

**Primary Actor:** System

**Secondary Actors:** Learner

**Preconditions:**

*   Tutor has been reviewed at least once
*   Learner is browsing/searching tutors

**Trigger:** Search results or tutor list is displayed

**Main Flow:**

1.  Learner performs search or browses tutors
2.  System retrieves tutor list with aggregated data
3.  For each Tutor card, system displays:
    *   Profile photo and name
    *   Star rating icon with average (e.g., ★ 4.8)
    *   Review count in parentheses (e.g., "(47 reviews)")
4.  Learner can click on Tutor card to see full profile and detailed reviews
5.  Rating helps Learner make informed decision

**Alternate Flows:**

*   **AF-11.5.1 (Zero Reviews):** Tutor cards for unreviewed tutors show "New" or no rating; review count shows "(0 reviews)"
*   **AF-11.5.2 (Rating Calculation):** System calculates average dynamically or caches for performance

**12\. Admin Panel Functionalities**

**12.1 Dashboard**

**FR-12.1.1:** Overview of Total Users, Active Bookings, and Total Revenue.

**12.2 User & Content Management**

*   **FR-12.2.1:** List view of all Learners and Tutors with options to Suspend or Ban users.
*   **FR-12.2.2:** Queue for reviewing Tutor Certificates (Approve/Reject).

**12.3 Financials**

*   **FR-12.3.1:** View transaction logs, commission totals, and pending payouts.
*   **FR-12.3.2:** Ability to refund payments in case of resolved disputes.

**12.4 Audit Logs (New)**

*   **FR-12.4.1:** The system shall maintain an immutable Audit Log of all critical Admin actions, including:
*   Banning/Unbanning users.
*   Approving/Rejecting documents.
*   Issuing Refunds or interfering with Escrow.
*   Viewing private chat logs.
*   **FR-12.4.2:** Logs must include the Admin ID, Action Type, Timestamp, and IP Address.

**Use Cases for Admin Panel Functionalities**

**UC-12.1: Admin Views Dashboard Overview**

**Use Case Name:** View Platform Statistics Dashboard

**Primary Actor:** Admin

**Secondary Actors:** System

**Preconditions:**

*   Admin is authenticated
*   Admin has access to Admin Panel

**Trigger:** Admin logs in or navigates to Admin Dashboard

**Main Flow:**

1.  Admin accesses Admin Panel
2.  System retrieves aggregated platform data
3.  System displays dashboard with key metrics:
    *   Total Users (Learners and Tutors count)
    *   Active Bookings (sessions scheduled for current/upcoming period)
    *   Total Revenue (platform commission earnings)
    *   Additional metrics: New users this week, Completed sessions, Pending verifications
4.  Dashboard displays charts/graphs for trends over time
5.  Admin can filter by date range
6.  Admin can click on metrics for detailed breakdowns

**Alternate Flows:**

*   **AF-12.1.1 (No Data):** If platform is new with no data, system displays zero values with "No data yet" message
*   **AF-12.1.2 (Data Loading):** If data takes time to aggregate, system shows loading indicator

**UC-12.2: Admin Manages User Accounts**

**Use Case Name:** View and Manage Learners and Tutors

**Primary Actor:** Admin

**Secondary Actors:** System, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Users exist in the system

**Trigger:** Admin navigates to "User Management" section

**Main Flow:**

1.  Admin accesses User Management in Admin Panel
2.  System displays list view of all users (Learners and Tutors)
3.  List shows: Name, Email, Role, Registration Date, Status, Verification (for Tutors)
4.  Admin can search by name or email
5.  Admin can filter by: Role, Status, Date range
6.  Admin clicks on a user to view full profile
7.  System displays detailed user information
8.  Admin can take actions:
    *   **Suspend:** Temporarily disable account
    *   **Ban:** Permanently disable account
    *   **Reactivate:** Restore suspended account
9.  Admin confirms action
10.  System updates user status
11.  System notifies user of account status change
12.  System logs action in Audit Log

**Alternate Flows:**

*   **AF-12.2.1 (Suspend with Reason):** Admin provides suspension reason; user sees reason in notification
*   **AF-12.2.2 (Ban Appeal):** System provides mechanism for banned user to appeal (handled via support)

**UC-12.3: Admin Reviews Tutor Certificate Queue**

**Use Case Name:** Process Pending Tutor Verifications

**Primary Actor:** Admin

**Secondary Actors:** System, Tutor, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Tutors have submitted documents for verification

**Trigger:** Admin navigates to "Verification Queue" or receives notification

**Main Flow:**

1.  Admin accesses Certificate Verification Queue
2.  System displays list of pending submissions
3.  Each entry shows: Tutor name, Submission date, Document types uploaded
4.  Admin selects a submission to review
5.  System displays:
    *   Tutor profile information
    *   Uploaded documents (viewable securely)
    *   Document types and metadata
6.  Admin examines each document
7.  Admin decides: Approve or Reject
8.  If Approve:
    *   System updates Tutor status to "Verified"
    *   System adds Verified Badge to profile
    *   System notifies Tutor of approval
9.  If Reject:
    *   Admin enters rejection reason
    *   System notifies Tutor with reason
    *   Tutor can resubmit
10.  System logs action in Audit Log

**Alternate Flows:**

*   **AF-12.3.1 (Request Additional Documents):** Admin requests more docs; status set to "Pending Additional Info"
*   **AF-12.3.2 (Document Unreadable):** Admin marks document as unreadable; requests re-upload

**UC-12.4: Admin Views Financial Reports**

**Use Case Name:** Access Transaction Logs and Financial Data

**Primary Actor:** Admin

**Secondary Actors:** System

**Preconditions:**

*   Admin is authenticated
*   Transactions have occurred on platform

**Trigger:** Admin navigates to "Financials" section in Admin Panel

**Main Flow:**

1.  Admin accesses Financial Reports
2.  System displays financial dashboard:
    *   Total transaction volume
    *   Total commission earned
    *   Pending payouts to Tutors
    *   Refunds processed
3.  Admin can view transaction logs
4.  Each transaction shows: Transaction ID, Date, Learner, Tutor, Amount, Commission, Status
5.  Admin can filter by: Date range, Transaction type, Status
6.  Admin can export reports (CSV, PDF)
7.  Admin can drill down into individual transactions

**Alternate Flows:**

*   **AF-12.4.1 (No Transactions):** If no transactions, system displays "No transactions yet"
*   **AF-12.4.2 (Export Failure):** If export fails, system displays error and retry option

**UC-12.5: Admin Processes Refund**

**Use Case Name:** Issue Refund for Resolved Dispute

**Primary Actor:** Admin

**Secondary Actors:** System, Payment Gateway, Learner, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Dispute has been resolved in favor of refund
*   Original payment exists in system

**Trigger:** Admin resolves dispute with refund decision OR processes manual refund request

**Main Flow:**

1.  Admin identifies transaction requiring refund
2.  System displays original transaction details
3.  Admin selects refund type:
    *   Full refund
    *   Partial refund (enter amount)
4.  Admin confirms refund details
5.  System initiates refund via Payment Gateway (Stripe)
6.  Payment Gateway processes refund
7.  System receives confirmation
8.  System updates transaction status to "Refunded"
9.  System notifies Learner of refund
10.  System logs action in Audit Log (Admin ID, Transaction ID, Refund amount, Timestamp)

**Alternate Flows:**

*   **AF-12.5.1 (Refund Failed):** If Payment Gateway rejects, system alerts Admin; may need manual intervention
*   **AF-12.5.2 (Partial Refund):** Admin specifies amount; remaining balance handled accordingly

**UC-12.6: Admin Views Audit Logs**

**Use Case Name:** Review System and Admin Activity Logs

**Primary Actor:** Admin (Senior/Supervisor)

**Secondary Actors:** System

**Preconditions:**

*   Admin is authenticated
*   Admin has permission to view audit logs
*   Actions have been logged

**Trigger:** Admin navigates to "Audit Logs" section

**Main Flow:**

1.  Admin accesses Audit Logs in Admin Panel
2.  System displays immutable log entries
3.  Each entry contains:
    *   Admin ID who performed action
    *   Action Type (Ban, Approve, Refund, View Chat, etc.)
    *   Timestamp of action
    *   IP Address of Admin
    *   Target (User ID, Transaction ID, etc.)
    *   Additional details/notes
4.  Admin can filter by: Admin ID, Action Type, Date range
5.  Admin can search for specific entries
6.  Logs are read-only and cannot be modified or deleted

**Alternate Flows:**

*   **AF-12.6.1 (Export Logs):** Admin can export logs for compliance/audit purposes
*   **AF-12.6.2 (Access Restricted):** Only authorized Admins can view full audit logs; regular Admins may have limited access

**13\. Notifications & Alerts**

**13.1 Triggers**

The system shall send Email and In-App notifications for:

*   **Registration:** Welcome email.
*   **Verification:** Certificate approved/rejected.
*   **Booking:** New request (Tutor), Booking Confirmed (Both).
*   **Session:** Reminder 1 hour before session.
*   **Payment:** Receipt (Learner), Payout processed (Tutor).
*   **Dispute:** Notification to both parties when a dispute is raised/resolved.

**Use Cases for Notifications & Alerts**

**UC-13.1: Send Welcome Email After Registration**

**Use Case Name:** Deliver Registration Confirmation

**Primary Actor:** System

**Secondary Actors:** Email Service, New User

**Preconditions:**

*   User has successfully completed registration
*   Valid email address was provided

**Trigger:** User account is created in database

**Main Flow:**

1.  User completes registration process
2.  System creates user account
3.  System triggers welcome email notification
4.  System generates email content:
    *   Welcome message
    *   User's name
    *   Quick start guide links
    *   Support contact information
5.  System sends email via Email Service
6.  Email Service delivers to user's inbox
7.  System logs email sent status

**Alternate Flows:**

*   **AF-13.1.1 (Email Delivery Failure):** If email fails, system retries up to 3 times; logs failure; user can request resend
*   **AF-13.1.2 (Invalid Email):** If email bounces, system flags account for email verification

**UC-13.2: Notify Tutor of Document Verification Result**

**Use Case Name:** Send Verification Approval or Rejection Notification

**Primary Actor:** System

**Secondary Actors:** Email Service, In-App Notification Service, Tutor

**Preconditions:**

*   Tutor has submitted verification documents
*   Admin has completed review

**Trigger:** Admin approves or rejects Tutor documents

**Main Flow (Approval):**

1.  Admin approves Tutor documents
2.  System updates Tutor verification status
3.  System prepares approval notification:
    *   Email: "Congratulations! Your profile is now verified"
    *   In-App: Badge and notification bell alert
4.  System sends both email and in-app notification
5.  Tutor receives confirmation of verified status

**Main Flow (Rejection):**

1.  Admin rejects Tutor documents with reason
2.  System prepares rejection notification:
    *   Email: "Document verification update" with rejection reason
    *   In-App: Notification with link to resubmit
3.  System sends both notifications
4.  Tutor is informed and can take corrective action

**Alternate Flows:**

*   **AF-13.2.1 (Email Opt-Out):** If Tutor opted out of emails, only in-app notification sent

**UC-13.3: Notify Parties of New Booking Request**

**Use Case Name:** Alert Tutor of Incoming Booking Request

**Primary Actor:** System

**Secondary Actors:** Email Service, Tutor, Learner

**Preconditions:**

*   Learner has submitted booking request
*   Payment has been processed

**Trigger:** Booking is created with "Pending" status

**Main Flow:**

1.  Learner completes booking request with payment
2.  System creates booking record
3.  System sends notification to Tutor:
    *   Email: "New booking request from \[Learner Name\]"
    *   In-App: Push notification and inbox alert
4.  Notification includes: Subject, Date/Time, Duration, "Accept/Decline" action link
5.  System sends confirmation to Learner:
    *   "Booking request sent to \[Tutor Name\]"
6.  Both parties are informed of pending status

**Alternate Flows:**

*   **AF-13.3.1 (Tutor Offline):** Notification queued; delivered when Tutor reconnects
*   **AF-13.3.2 (Urgent Booking):** If session is within 24 hours, notification marked as urgent

**UC-13.4: Send Booking Confirmation to Both Parties**

**Use Case Name:** Confirm Accepted Booking

**Primary Actor:** System

**Secondary Actors:** Email Service, Tutor, Learner

**Preconditions:**

*   Booking request exists
*   Tutor has accepted the booking

**Trigger:** Tutor clicks "Accept" on booking request

**Main Flow:**

1.  Tutor accepts booking
2.  System updates booking status to "Confirmed"
3.  System sends confirmation to Learner:
    *   Email with booking details (Tutor, Subject, Date/Time, Location/Link)
    *   In-App notification
    *   Calendar invite attachment (optional)
4.  System sends confirmation to Tutor:
    *   Email confirming acceptance
    *   In-App notification
    *   Booking added to Tutor's calendar
5.  Both parties have confirmed session details

**Alternate Flows:**

*   **AF-13.4.1 (Decline Notification):** If Tutor declines, system notifies Learner of rejection

**UC-13.5: Send Session Reminder**

**Use Case Name:** Remind Users of Upcoming Session

**Primary Actor:** System

**Secondary Actors:** Email Service, Tutor, Learner

**Preconditions:**

*   Booking is confirmed
*   Session start time is within reminder window (1 hour)

**Trigger:** System scheduler detects session starting in 1 hour

**Main Flow:**

1.  System runs scheduled job to check upcoming sessions
2.  System identifies sessions starting within 1 hour
3.  System sends reminder to Learner:
    *   Email: "Your session with \[Tutor\] starts in 1 hour"
    *   In-App: Push notification
    *   Details: Subject, Time, Online link or In-Person location
4.  System sends reminder to Tutor:
    *   Email: "You have a session with \[Learner\] in 1 hour"
    *   In-App: Push notification
5.  Both parties are reminded and can prepare

**Alternate Flows:**

*   **AF-13.5.1 (Session Cancelled):** If booking was cancelled, no reminder sent
*   **AF-13.5.2 (Configurable Reminder Time):** Future enhancement could allow user-defined reminder times

**UC-13.6: Send Payment Notifications**

**Use Case Name:** Notify of Payment and Payout Events

**Primary Actor:** System

**Secondary Actors:** Email Service, Learner, Tutor

**Preconditions:**

*   Payment event has occurred

**Trigger:** Payment is processed OR payout is released to Tutor

**Main Flow (Learner Payment Receipt):**

1.  Learner completes payment for booking
2.  System generates receipt
3.  System sends receipt email to Learner:
    *   Transaction details
    *   Amount paid
    *   PDF receipt attachment
4.  System sends in-app confirmation

**Main Flow (Tutor Payout Notification):**

1.  Session is completed and funds released
2.  System calculates Tutor payout (minus commission)
3.  System updates Tutor balance
4.  System sends notification to Tutor:
    *   Email: "Payment of £X added to your balance"
    *   In-App: Balance update alert
5.  Tutor is informed funds are available

**Alternate Flows:**

*   **AF-13.6.1 (Refund Notification):** If refund processed, both parties notified of reversal

**UC-13.7: Send Dispute Notifications**

**Use Case Name:** Alert Parties of Dispute Status Changes

**Primary Actor:** System

**Secondary Actors:** Email Service, Learner, Tutor

**Preconditions:**

*   A dispute has been raised or resolved

**Trigger:** Dispute is raised OR Admin resolves dispute

**Main Flow (Dispute Raised):**

1.  Learner raises dispute
2.  System sends notification to Tutor:
    *   Email: "A dispute has been raised for your session with \[Learner\]"
    *   In-App: Alert with dispute details
3.  System confirms to Learner:
    *   "Your dispute has been submitted and is under review"

**Main Flow (Dispute Resolved):**

1.  Admin resolves dispute
2.  System sends notification to both parties:
    *   Email: "Dispute resolution for session on \[Date\]"
    *   Details of outcome (refund/payment released)
    *   In-App: Resolution notification
3.  Both parties are informed of final decision

**Alternate Flows:**

*   **AF-13.7.1 (Additional Info Requested):** If Admin requests more info, system notifies relevant party

**14\. Security & Compliance**

**14\. Security & Compliance**

*   **FR-14.1 Data Privacy:** Personal contact details (phone/email) are masked until necessary or restricted to platform channels.
*   **FR-14.2 Encryption:** All data in transit (SSL/TLS) and sensitive data at rest (passwords) must be encrypted.
*   **FR-14.3 Secure Uploads:** Certificate files must be stored in a secure bucket with restricted access URLs.
*   **FR-14.4 Admin Chat Access Control:** Admin access to Tutor–Learner conversations shall be strictly read-only and logged for audit purposes.
*   **FR-14.5 User Transparency:** Users shall be informed via platform policy and/or UI notice that in-app communications may be monitored by Admins for safety, compliance, dispute resolution, and fraud prevention.
*   **FR-14.6 Data Isolation:** Conversation data shall not be accessible outside the Admin Panel or shared with unauthorized users or external systems.

**Use Cases for Security & Compliance**

**UC-14.1: Mask Personal Contact Details**

**Use Case Name:** Protect User Contact Information

**Primary Actor:** System

**Secondary Actors:** Learner, Tutor

**Preconditions:**

*   Users have registered with contact details
*   Users are interacting on the platform

**Trigger:** Any display of user information to another user

**Main Flow:**

1.  User views another user's profile or information
2.  System retrieves user data from database
3.  System applies masking rules to sensitive fields:
    *   Phone number: Displays as "\*\*\*\*1234" (last 4 digits only)
    *   Email: Displays as "j\*\*\*@email.com" (partial masking)
4.  System displays masked information to requesting user
5.  Full contact details remain protected unless exposed through authorized channels (e.g., booking confirmation)

**Alternate Flows:**

*   **AF-14.1.1 (Admin View):** Admins can view unmasked contact details for support purposes
*   **AF-14.1.2 (Confirmed Booking):** After booking confirmed, limited contact info may be shared per policy

**UC-14.2: Encrypt Data in Transit**

**Use Case Name:** Secure Communication Between Client and Server

**Primary Actor:** System

**Secondary Actors:** User (Any), Web Browser

**Preconditions:**

*   User is accessing the platform
*   SSL/TLS certificates are configured

**Trigger:** Any HTTP request from client to server

**Main Flow:**

1.  User initiates connection to platform
2.  System enforces HTTPS (redirects HTTP to HTTPS)
3.  Browser and server perform TLS handshake
4.  Encrypted connection is established
5.  All data transmitted over the connection is encrypted:
    *   Login credentials
    *   Payment information
    *   Personal data
    *   Chat messages
6.  Data cannot be intercepted or read by third parties

**Alternate Flows:**

*   **AF-14.2.1 (Certificate Expired):** If SSL certificate expires, system alerts Admin; users see browser warning
*   **AF-14.2.2 (Downgrade Attack):** System rejects non-HTTPS connections; does not fall back to HTTP

**UC-14.3: Encrypt Sensitive Data at Rest**

**Use Case Name:** Protect Stored Passwords and Sensitive Data

**Primary Actor:** System

**Secondary Actors:** Database

**Preconditions:**

*   User data is being stored in database
*   Encryption configuration is enabled

**Trigger:** User creates account or updates password

**Main Flow:**

1.  User enters password during registration or password change
2.  System receives plaintext password
3.  System applies strong hashing algorithm (bcrypt, Argon2)
4.  System stores only the hash, not the plaintext
5.  Original password is never stored or logged
6.  During login, system compares hash of entered password to stored hash
7.  Even if database is compromised, passwords remain protected

**Alternate Flows:**

*   **AF-14.3.1 (Encryption Failure):** If hashing fails, system prevents account creation and alerts Admin
*   **AF-14.3.2 (Password Breach Detection):** System can optionally check against known breached passwords

**UC-14.4: Secure Document Upload and Storage**

**Use Case Name:** Store Tutor Certificates Securely

**Primary Actor:** Tutor

**Secondary Actors:** System, S3 Storage, Admin

**Preconditions:**

*   Tutor is uploading verification documents
*   S3 bucket is configured with appropriate permissions

**Trigger:** Tutor uploads document file

**Main Flow:**

1.  Tutor selects document to upload
2.  System validates file type and size
3.  System generates unique, non-guessable file key
4.  System uploads file to S3 bucket with:
    *   Private ACL (not publicly accessible)
    *   Server-side encryption enabled
    *   Time-limited pre-signed URLs for authorized access
5.  System stores only the file reference in database
6.  When Admin needs to view, system generates temporary signed URL
7.  URL expires after short time window

**Alternate Flows:**

*   **AF-14.4.1 (Direct Access Attempt):** If someone tries direct URL without signature, access is denied
*   **AF-14.4.2 (Virus Scan):** System can optionally scan uploads for malware before storage

**UC-14.5: Admin Chat Access with Audit Logging**

**Use Case Name:** Track Admin Access to User Conversations

**Primary Actor:** Admin

**Secondary Actors:** System, Audit Log

**Preconditions:**

*   Admin is authenticated
*   Admin accesses chat oversight feature

**Trigger:** Admin views any Tutor-Learner conversation

**Main Flow:**

1.  Admin navigates to Chat Oversight
2.  Admin selects a conversation to view
3.  System retrieves chat history in read-only mode
4.  Before displaying, system creates audit log entry:
    *   Admin ID
    *   Action: "Viewed Chat"
    *   Conversation ID
    *   Tutor ID and Learner ID involved
    *   Timestamp
    *   IP Address of Admin
5.  Chat is displayed to Admin
6.  Audit entry is immutable and cannot be deleted
7.  Senior Admins can review audit logs for compliance

**Alternate Flows:**

*   **AF-14.5.1 (Audit Log Failure):** If logging fails, access may be temporarily denied to ensure compliance
*   **AF-14.5.2 (Unauthorized Access Attempt):** If non-Admin attempts access, system blocks and logs violation

**UC-14.6: User Notification of Monitoring Policy**

**Use Case Name:** Inform Users of Communication Monitoring

**Primary Actor:** System

**Secondary Actors:** User (Learner or Tutor)

**Preconditions:**

*   User is registering or accessing chat features

**Trigger:** User registers account OR user accesses chat for first time

**Main Flow:**

1.  During registration, Terms of Service include monitoring disclosure
2.  User agrees to Terms including:
    *   "In-app communications may be monitored by Admins for safety, compliance, dispute resolution, and fraud prevention"
3.  When user first accesses chat:
    *   System displays reminder banner: "Messages may be reviewed by platform administrators"
4.  Banner remains visible in chat interface
5.  User is transparently informed of monitoring policy

**Alternate Flows:**

*   **AF-14.6.1 (Terms Update):** If policy changes, system prompts users to re-accept updated terms
*   **AF-14.6.2 (Privacy Settings):** User can view full privacy policy from settings

**UC-14.7: Enforce Data Isolation for Conversations**

**Use Case Name:** Restrict Conversation Data Access

**Primary Actor:** System

**Secondary Actors:** Users, Admin, External Systems

**Preconditions:**

*   Conversations exist in the system
*   Various parties may attempt to access data

**Trigger:** Any request for conversation data

**Main Flow:**

1.  Request is made for conversation data
2.  System validates requester's identity and role
3.  System applies access control rules:
    *   Learner: Can only access their own conversations
    *   Tutor: Can only access their own conversations
    *   Admin: Can access all conversations (read-only, with audit)
    *   External System: Access denied
4.  If authorized, system returns appropriate data
5.  If unauthorized, system returns 403 Forbidden
6.  All access attempts are logged

**Alternate Flows:**

*   **AF-14.7.1 (API Export Request):** System prevents bulk export of conversations to external systems
*   **AF-14.7.2 (Data Breach Attempt):** If suspicious access pattern detected, system alerts security team

**15\. Non-Functional Requirements**

*   **NFR-1 (Performance):** Dashboard and search results should load within 2 seconds.

**NFR-2 (Scalability):** The backend structure must support horizontal scaling.

*   **NFR-3 (Availability):** The platform should aim for 99.9% uptime.
*   **NFR-4 (Usability):** The UI should be responsive (Mobile, Tablet, Desktop).

**16\. Technology Stack (Context)**

*   **Frontend:** React (MERN Stack), shadcn UI.
*   **Backend:** Node.js with Express.js.
*   **Database:** MongoDB.
*   **Authentication:** JWT and Google OAuth 2.0.
*   **Media:** S3.
*   **Real-time:** Socket.io.
*   **Maps:** OpenStreetMap + Leaflet.