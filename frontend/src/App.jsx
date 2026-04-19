import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
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
import AuthenticatedNavigationGuard from '@/components/AuthenticatedNavigationGuard';
import OnBoardingScreen from './pages/auth/OnBoardingScreen';
import AgeConsent from './pages/auth/AgeConsent';
import { Loader2 } from 'lucide-react';
import { isAuthenticated, getAuthenticatedHomePath } from '@/services/authService';

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
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));

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

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to={getAuthenticatedHomePath()} replace />;
  }
  return children;
}

/** Some hosts / mis-set FRONTEND_URL send OAuth users to /index.html?token=... — no route matched, so the app was blank. */
function IndexHtmlOAuthRedirect() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get('token');
  if (token) {
    return <Navigate to={`/auth/callback${search}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function AppRootLayout() {
  return (
    <>
      <AuthenticatedNavigationGuard />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AppRootLayout />,
    children: [
      {
        path: '/',
        element: (
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        ),
      },
      { path: '/login', element: <PublicOnlyRoute><Login /></PublicOnlyRoute> },
      { path: '/register', element: <PublicOnlyRoute><Register /></PublicOnlyRoute> },
      { path: '/forgot-password', element: <PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute> },
      { path: '/reset-password/:token', element: <PublicOnlyRoute><ResetPassword /></PublicOnlyRoute> },
      { path: '/index.html', element: <IndexHtmlOAuthRedirect /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/onboarding', element: <OnBoardingScreen /> },
      { path: '/age-consent', element: <AgeConsent /> },

      { path: '/about', element: <Suspense fallback={<RouteFallback />}><About /></Suspense> },
      { path: '/how-it-works', element: <Suspense fallback={<RouteFallback />}><HowItWorks /></Suspense> },
      { path: '/privacy', element: <Suspense fallback={<RouteFallback />}><PrivacyPolicy /></Suspense> },
      { path: '/terms', element: <Suspense fallback={<RouteFallback />}><Terms /></Suspense> },
      { path: '/contact', element: <Suspense fallback={<RouteFallback />}><Contact /></Suspense> },

      {
        path: '/tutors',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <TutorListing />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <LearnerLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Suspense fallback={<RouteFallback />}><LearnerDashboard /></Suspense> },
          { path: 'bookings', element: <Suspense fallback={<RouteFallback />}><MyBookings /></Suspense> },
          { path: 'bookings/:bookingId/chat', element: <Suspense fallback={<RouteFallback />}><BookingChat /></Suspense> },
          { path: 'tuition-requests', element: <Suspense fallback={<RouteFallback />}><MyTuitionRequestsList /></Suspense> },
          { path: 'tuition-requests/new', element: <Suspense fallback={<RouteFallback />}><CreateTuitionRequest /></Suspense> },
          { path: 'tuition-requests/:requestId', element: <Suspense fallback={<RouteFallback />}><TuitionRequestDetail /></Suspense> },
          { path: 'browse-tutors', element: <Suspense fallback={<RouteFallback />}><BrowseTutors /></Suspense> },
          { path: 'tutors/:id', element: <Suspense fallback={<RouteFallback />}><TutorProfile /></Suspense> },
          { path: 'messages', element: <Suspense fallback={<RouteFallback />}><LearnerMessages /></Suspense> },
          { path: 'reviews', element: <Suspense fallback={<RouteFallback />}><LearnerReviews /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<RouteFallback />}><MyProfile /></Suspense> },
          { path: 'policy', element: <Suspense fallback={<RouteFallback />}><Policy /></Suspense> },
          { path: 'support', element: <Suspense fallback={<RouteFallback />}><LearnerSupportTickets /></Suspense> },
          { path: 'support/new', element: <Suspense fallback={<RouteFallback />}><LearnerCreateSupportTicket /></Suspense> },
          { path: 'support/:ticketId', element: <Suspense fallback={<RouteFallback />}><LearnerSupportTicketDetail /></Suspense> },
        ],
      },
      {
        path: '/tutor',
        element: (
          <ProtectedRoute>
            <TutorLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Suspense fallback={<RouteFallback />}><TutorDashboard /></Suspense> },
          { path: 'bookings', element: <Suspense fallback={<RouteFallback />}><TutorBookings /></Suspense> },
          { path: 'bookings/:bookingId', element: <Suspense fallback={<RouteFallback />}><TutorBookingDetail /></Suspense> },
          { path: 'bookings/:bookingId/chat', element: <Suspense fallback={<RouteFallback />}><BookingChat /></Suspense> },
          { path: 'tuition-requests', element: <Suspense fallback={<RouteFallback />}><BrowseTuitionRequests /></Suspense> },
          { path: 'messages', element: <Suspense fallback={<RouteFallback />}><TutorMessages /></Suspense> },
          { path: 'earnings', element: <Suspense fallback={<RouteFallback />}><TutorWallet /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<RouteFallback />}><TutorMyProfile /></Suspense> },
          { path: 'verification-documents', element: <Suspense fallback={<RouteFallback />}><TutorVerificationDocuments /></Suspense> },
          { path: 'policy', element: <Suspense fallback={<RouteFallback />}><Policy /></Suspense> },
          { path: 'availability', element: <Suspense fallback={<RouteFallback />}><ManageAvailability /></Suspense> },
          { path: 'create', element: <Suspense fallback={<RouteFallback />}><CreateTutorProfile /></Suspense> },
          { path: 'support', element: <Suspense fallback={<RouteFallback />}><TutorSupportTickets /></Suspense> },
          { path: 'support/new', element: <Suspense fallback={<RouteFallback />}><TutorCreateSupportTicket /></Suspense> },
          { path: 'support/:ticketId', element: <Suspense fallback={<RouteFallback />}><TutorSupportTicketDetail /></Suspense> },
        ],
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Suspense fallback={<RouteFallback />}><AdminDashboard /></Suspense> },
          { path: 'users', element: <Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense> },
          { path: 'tutors/pending', element: <Suspense fallback={<RouteFallback />}><AdminTutorVerification /></Suspense> },
          { path: 'dbs', element: <Suspense fallback={<RouteFallback />}><AdminDbsVerification /></Suspense> },
          { path: 'financials', element: <Suspense fallback={<RouteFallback />}><AdminFinancials /></Suspense> },
          { path: 'chat', element: <Suspense fallback={<RouteFallback />}><AdminChatViewer /></Suspense> },
          { path: 'audit-log', element: <Suspense fallback={<RouteFallback />}><AdminAuditLog /></Suspense> },
          { path: 'config', element: <Suspense fallback={<RouteFallback />}><AdminConfig /></Suspense> },
          { path: 'notifications', element: <Suspense fallback={<RouteFallback />}><AdminNotifications /></Suspense> },
          { path: 'reported-reviews', element: <Suspense fallback={<RouteFallback />}><AdminReportedReviews /></Suspense> },
          { path: 'support', element: <Suspense fallback={<RouteFallback />}><AdminSupportTickets /></Suspense> },
          { path: 'support/:ticketId', element: <Suspense fallback={<RouteFallback />}><AdminSupportTicketDetail /></Suspense> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster />
    </SocketProvider>
  );
}

export default App;
