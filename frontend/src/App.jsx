import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/components/landing/LandingPage';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallbackPage from '@/components/auth/AuthCallbackPage';
import AdminLayout from '@/layouts/AdminLayout';
import LearnerLayout from '@/layouts/LearnerLayout';
import TutorLayout from '@/layouts/TutorLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnBoardingScreen from './pages/auth/OnBoardingScreen';
import AgeConsent from './pages/auth/AgeConsent';
import { Loader2 } from 'lucide-react';

// Lazy-loaded Learner dashboard routes
const LearnerDashboard = lazy(() => import('@/pages/dashboard/LearnerDashboard'));
const LearnerMessages = lazy(() => import('@/pages/dashboard/LearnerMessages'));
const LearnerReviews = lazy(() => import('@/pages/dashboard/LearnerReviews'));
const LearnerSupportTickets = lazy(() => import('@/pages/dashboard/LearnerSupportTickets'));
const LearnerCreateSupportTicket = lazy(() => import('@/pages/dashboard/LearnerCreateSupportTicket'));
const LearnerSupportTicketDetail = lazy(() => import('@/pages/dashboard/LearnerSupportTicketDetail'));

// Lazy-loaded Tutor dashboard routes
const TutorDashboard = lazy(() => import('@/pages/dashboard/TutorDashboard'));
const TutorMessages = lazy(() => import('@/pages/tutor/TutorMessages'));
const TutorSupportTickets = lazy(() => import('@/pages/tutor/TutorSupportTickets'));
const TutorCreateSupportTicket = lazy(() => import('@/pages/tutor/TutorCreateSupportTicket'));
const TutorSupportTicketDetail = lazy(() => import('@/pages/tutor/TutorSupportTicketDetail'));

// Lazy-loaded shared / learner pages
const CreateTuitionRequest = lazy(() => import('@/pages/learner/CreateTuitionRequest'));
const MyTuitionRequestsList = lazy(() => import('@/pages/learner/MyTuitionRequests').then((m) => ({ default: m.MyTuitionRequestsList })));
const TuitionRequestDetail = lazy(() => import('@/pages/learner/MyTuitionRequests').then((m) => ({ default: m.TuitionRequestDetail })));
const MyProfile = lazy(() => import('@/pages/profile/MyProfile'));
const MyBookings = lazy(() => import('@/pages/bookings/MyBookings'));
const TutorBookings = lazy(() => import('@/pages/bookings/TutorBookings'));
const TutorBookingDetail = lazy(() => import('@/pages/bookings/TutorBookingDetail'));
const BookingChat = lazy(() => import('@/pages/bookings/BookingChat'));
const CreateTutorProfile = lazy(() => import('@/pages/tutor/CreateTutorProfile'));
const TutorProfile = lazy(() => import('@/pages/tutor/TutorProfile'));
const TutorMyProfile = lazy(() => import('@/pages/tutor/TutorMyProfile'));
const TutorListing = lazy(() => import('@/pages/tutor/TutorListing'));
const BrowseTutors = lazy(() => import('@/pages/tutor/BrowseTutors'));
const ManageAvailability = lazy(() => import('@/pages/tutor/ManageAvailability'));
const TutorWallet = lazy(() => import('@/pages/tutor/TutorWallet'));
const TutorVerificationDocuments = lazy(() => import('@/pages/tutor/TutorVerificationDocuments'));
const BrowseTuitionRequests = lazy(() => import('@/pages/tutor/BrowseTuitionRequests'));
const Policy = lazy(() => import('@/pages/Policy'));
const About = lazy(() => import('@/pages/About'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Contact = lazy(() => import('@/pages/Contact'));
const Terms = lazy(() => import('@/pages/Terms'));

// Lazy-loaded Admin routes (for consistency; user asked learner + tutor only, but admin uses same layout pattern)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminTutorVerification = lazy(() => import('@/pages/admin/AdminTutorVerification'));
const AdminDbsVerification = lazy(() => import('@/pages/admin/AdminDbsVerification'));
const AdminFinancials = lazy(() => import('@/pages/admin/AdminFinancials'));
const AdminChatViewer = lazy(() => import('@/pages/admin/AdminChatViewer'));
const AdminAuditLog = lazy(() => import('@/pages/admin/AdminAuditLog'));
const AdminConfig = lazy(() => import('@/pages/admin/AdminConfig'));
const AdminReportedReviews = lazy(() => import('@/pages/admin/AdminReportedReviews'));
const AdminSupportTickets = lazy(() => import('@/pages/admin/AdminSupportTickets'));
const AdminSupportTicketDetail = lazy(() => import('@/pages/admin/AdminSupportTicketDetail'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
    </div>
  );
}

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

        {/* Public info pages */}
        <Route path="/about" element={<Suspense fallback={<RouteFallback />}><About /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<RouteFallback />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<RouteFallback />}><Terms /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<RouteFallback />}><Contact /></Suspense>} />
        
        {/* All other routes require authentication */}
        <Route
          path="/tutors"
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteFallback />}>
                <TutorListing />
              </Suspense>
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
          <Route index element={<Suspense fallback={<RouteFallback />}><LearnerDashboard /></Suspense>} />
          <Route path="bookings" element={<Suspense fallback={<RouteFallback />}><MyBookings /></Suspense>} />
          <Route path="bookings/:bookingId/chat" element={<Suspense fallback={<RouteFallback />}><BookingChat /></Suspense>} />
          <Route path="tuition-requests" element={<Suspense fallback={<RouteFallback />}><MyTuitionRequestsList /></Suspense>} />
          <Route path="tuition-requests/new" element={<Suspense fallback={<RouteFallback />}><CreateTuitionRequest /></Suspense>} />
          <Route path="tuition-requests/:requestId" element={<Suspense fallback={<RouteFallback />}><TuitionRequestDetail /></Suspense>} />
          <Route path="browse-tutors" element={<Suspense fallback={<RouteFallback />}><BrowseTutors /></Suspense>} />
          <Route path="tutors/:id" element={<Suspense fallback={<RouteFallback />}><TutorProfile /></Suspense>} />
          <Route path="messages" element={<Suspense fallback={<RouteFallback />}><LearnerMessages /></Suspense>} />
          <Route path="reviews" element={<Suspense fallback={<RouteFallback />}><LearnerReviews /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<RouteFallback />}><MyProfile /></Suspense>} />
          <Route path="policy" element={<Suspense fallback={<RouteFallback />}><Policy /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<RouteFallback />}><LearnerSupportTickets /></Suspense>} />
          <Route path="support/new" element={<Suspense fallback={<RouteFallback />}><LearnerCreateSupportTicket /></Suspense>} />
          <Route path="support/:ticketId" element={<Suspense fallback={<RouteFallback />}><LearnerSupportTicketDetail /></Suspense>} />
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
          <Route index element={<Suspense fallback={<RouteFallback />}><TutorDashboard /></Suspense>} />
          <Route path="bookings" element={<Suspense fallback={<RouteFallback />}><TutorBookings /></Suspense>} />
          <Route path="bookings/:bookingId" element={<Suspense fallback={<RouteFallback />}><TutorBookingDetail /></Suspense>} />
          <Route path="bookings/:bookingId/chat" element={<Suspense fallback={<RouteFallback />}><BookingChat /></Suspense>} />
          <Route path="tuition-requests" element={<Suspense fallback={<RouteFallback />}><BrowseTuitionRequests /></Suspense>} />
          <Route path="messages" element={<Suspense fallback={<RouteFallback />}><TutorMessages /></Suspense>} />
          <Route path="earnings" element={<Suspense fallback={<RouteFallback />}><TutorWallet /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<RouteFallback />}><TutorMyProfile /></Suspense>} />
          <Route path="verification-documents" element={<Suspense fallback={<RouteFallback />}><TutorVerificationDocuments /></Suspense>} />
          <Route path="policy" element={<Suspense fallback={<RouteFallback />}><Policy /></Suspense>} />
          <Route path="availability" element={<Suspense fallback={<RouteFallback />}><ManageAvailability /></Suspense>} />
          <Route path="create" element={<Suspense fallback={<RouteFallback />}><CreateTutorProfile /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<RouteFallback />}><TutorSupportTickets /></Suspense>} />
          <Route path="support/new" element={<Suspense fallback={<RouteFallback />}><TutorCreateSupportTicket /></Suspense>} />
          <Route path="support/:ticketId" element={<Suspense fallback={<RouteFallback />}><TutorSupportTicketDetail /></Suspense>} />
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
          <Route index element={<Suspense fallback={<RouteFallback />}><AdminDashboard /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense>} />
          <Route path="tutors/pending" element={<Suspense fallback={<RouteFallback />}><AdminTutorVerification /></Suspense>} />
          <Route path="dbs" element={<Suspense fallback={<RouteFallback />}><AdminDbsVerification /></Suspense>} />
          <Route path="financials" element={<Suspense fallback={<RouteFallback />}><AdminFinancials /></Suspense>} />
          <Route path="chat" element={<Suspense fallback={<RouteFallback />}><AdminChatViewer /></Suspense>} />
          <Route path="audit-log" element={<Suspense fallback={<RouteFallback />}><AdminAuditLog /></Suspense>} />
          <Route path="config" element={<Suspense fallback={<RouteFallback />}><AdminConfig /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<RouteFallback />}><AdminNotifications /></Suspense>} />
          <Route path="reported-reviews" element={<Suspense fallback={<RouteFallback />}><AdminReportedReviews /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<RouteFallback />}><AdminSupportTickets /></Suspense>} />
          <Route path="support/:ticketId" element={<Suspense fallback={<RouteFallback />}><AdminSupportTicketDetail /></Suspense>} />
        </Route>
      </Routes>
      </BrowserRouter>
      <Toaster />
    </SocketProvider>
  );
}

export default App;
