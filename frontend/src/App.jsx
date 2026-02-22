// --- 1. PRE-LOAD CRITICAL UI ONLY ---
// We keep Layouts and ProtectedRoute non-lazy to avoid "flashing" the navigation
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/layouts/AdminLayout';
import LearnerLayout from '@/layouts/LearnerLayout';
import TutorLayout from '@/layouts/TutorLayout';

// --- 2. LAZY LOAD EVERYTHING ELSE ---

// Auth & Public
const LandingPage = lazy(() => import('@/components/landing/LandingPage'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const AuthCallbackPage = lazy(() => import('@/components/auth/AuthCallbackPage'));
const OnBoardingScreen = lazy(() => import('./pages/auth/OnBoardingScreen'));
const AgeConsent = lazy(() => import('./pages/auth/AgeConsent'));
const Policy = lazy(() => import('./pages/Policy'));

// Learner Pages
const LearnerDashboard = lazy(() => import('@/pages/dashboard/LearnerDashboard'));
const LearnerMessages = lazy(() => import('@/pages/dashboard/LearnerMessages'));
const LearnerReviews = lazy(() => import('@/pages/dashboard/LearnerReviews'));
const MyBookings = lazy(() => import('@/pages/bookings/MyBookings'));
const BookingChat = lazy(() => import('@/pages/bookings/BookingChat'));
const MyProfile = lazy(() => import('@/pages/profile/MyProfile'));
const BrowseTutors = lazy(() => import('@/pages/tutor/BrowseTutors'));
const TutorProfile = lazy(() => import('@/pages/tutor/TutorProfile'));

// Learner Support
const LearnerSupportTickets = lazy(() => import('@/pages/dashboard/LearnerSupportTickets'));
const LearnerCreateSupportTicket = lazy(() => import('@/pages/dashboard/LearnerCreateSupportTicket'));
const LearnerSupportTicketDetail = lazy(() => import('@/pages/dashboard/LearnerSupportTicketDetail'));

// Tuition Requests
const CreateTuitionRequest = lazy(() => import('@/pages/learner/CreateTuitionRequest'));
const { MyTuitionRequestsList, TuitionRequestDetail } = {
  MyTuitionRequestsList: lazy(() => import('@/pages/learner/MyTuitionRequests').then(module => ({ default: module.MyTuitionRequestsList }))),
  TuitionRequestDetail: lazy(() => import('@/pages/learner/MyTuitionRequests').then(module => ({ default: module.TuitionRequestDetail })))
};

// Tutor Pages
const TutorDashboard = lazy(() => import('@/pages/dashboard/TutorDashboard'));
const TutorMessages = lazy(() => import('@/pages/tutor/TutorMessages'));
const TutorBookings = lazy(() => import('@/pages/bookings/TutorBookings'));
const TutorBookingDetail = lazy(() => import('@/pages/bookings/TutorBookingDetail'));
const TutorWallet = lazy(() => import('@/pages/tutor/TutorWallet'));
const TutorMyProfile = lazy(() => import('@/pages/tutor/TutorMyProfile'));
const ManageAvailability = lazy(() => import('@/pages/tutor/ManageAvailability'));
const BrowseTuitionRequests = lazy(() => import('@/pages/tutor/BrowseTuitionRequests'));
const TutorListing = lazy(() => import('@/pages/tutor/TutorListing'));
const CreateTutorProfile = lazy(() => import('@/pages/tutor/CreateTutorProfile'));
const TutorVerificationDocuments = lazy(() => import('@/pages/tutor/TutorVerificationDocuments'));

// Tutor Support
const TutorSupportTickets = lazy(() => import('@/pages/tutor/TutorSupportTickets'));
const TutorCreateSupportTicket = lazy(() => import('@/pages/tutor/TutorCreateSupportTicket'));
const TutorSupportTicketDetail = lazy(() => import('@/pages/tutor/TutorSupportTicketDetail'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminTutorVerification = lazy(() => import('@/pages/admin/AdminTutorVerification'));
const AdminDbsVerification = lazy(() => import('@/pages/admin/AdminDbsVerification'));
const AdminFinancials = lazy(() => import('@/pages/admin/AdminFinancials'));
const AdminDisputes = lazy(() => import('@/pages/admin/AdminDisputes'));
const AdminDisputeDetail = lazy(() => import('@/pages/admin/AdminDisputeDetail'));
const AdminChatViewer = lazy(() => import('@/pages/admin/AdminChatViewer'));
const AdminAuditLog = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminConfig = lazy(() => import('@/pages/admin/AdminConfig'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminReportedReviews = lazy(() => import('@/pages/admin/AdminReportedReviews'));
const AdminSupportTickets = lazy(() => import('@/pages/admin/AdminSupportTickets'));
const AdminSupportTicketDetail = lazy(() => import('@/pages/admin/AdminSupportTicketDetail'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Route - Only Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes - public so users can authenticate */}
        <Route path="/login" element={<Login />} />
        <Route path="/register?" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnBoardingScreen />} />
        <Route path="/age-consent?" element={<AgeConsent/>} />
        
        {/* All other routes require authentication */}
        <Route
          path="/tutors"
          element={
            <ProtectedRoute>
              <TutorListing />
            </ProtectedRoute>
          }
        />
        {/* Learner: sidebar layout, nested routes under /dashboard/* */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LearnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LearnerDashboard />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="bookings/:bookingId/chat" element={<BookingChat />} />
          <Route path="tuition-requests" element={<MyTuitionRequestsList />} />
          <Route path="tuition-requests/new" element={<CreateTuitionRequest />} />
          <Route path="tuition-requests/:requestId" element={<TuitionRequestDetail />} />
          <Route path="browse-tutors" element={<BrowseTutors />} />
          <Route path="tutors/:id" element={<TutorProfile />} />
          <Route path="messages" element={<LearnerMessages />} />
          <Route path="reviews" element={<LearnerReviews />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="policy" element={<Policy />} />
          <Route path="support" element={<LearnerSupportTickets />} />
          <Route path="support/new" element={<LearnerCreateSupportTicket />} />
          <Route path="support/:ticketId" element={<LearnerSupportTicketDetail />} />
        </Route>
        {/* Tutor: sidebar layout, nested routes under /tutor/* */}
        <Route
          path="/tutor"
          element={
            <ProtectedRoute>
              <TutorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TutorDashboard />} />
          <Route path="bookings" element={<TutorBookings />} />
          <Route path="bookings/:bookingId" element={<TutorBookingDetail />} />
          <Route path="bookings/:bookingId/chat" element={<BookingChat />} />
          <Route path="tuition-requests" element={<BrowseTuitionRequests />} />
          <Route path="messages" element={<TutorMessages />} />
          <Route path="earnings" element={<TutorWallet />} />
          <Route path="profile" element={<TutorMyProfile />} />
          <Route path="verification-documents" element={<TutorVerificationDocuments />} />
          <Route path="policy" element={<Policy />} />
          <Route path="availability" element={<ManageAvailability />} />
          <Route path="create" element={<CreateTutorProfile />} />
          <Route path="support" element={<TutorSupportTickets />} />
          <Route path="support/new" element={<TutorCreateSupportTicket />} />
          <Route path="support/:ticketId" element={<TutorSupportTicketDetail />} />
        </Route>
        {/* Admin: sidebar layout, nested routes, no full page reload */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tutors/pending" element={<AdminTutorVerification />} />
          <Route path="dbs" element={<AdminDbsVerification />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="disputes/:disputeId" element={<AdminDisputeDetail />} />
          <Route path="chat" element={<AdminChatViewer />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="reported-reviews" element={<AdminReportedReviews />} />
          <Route path="support" element={<AdminSupportTickets />} />
          <Route path="support/:ticketId" element={<AdminSupportTicketDetail />} />
        </Route>
      </Routes>
      </BrowserRouter>
      <Toaster />
    </SocketProvider>
  );
}

export default App;
