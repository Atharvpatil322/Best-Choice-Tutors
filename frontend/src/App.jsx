import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/components/landing/LandingPage';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallbackPage from '@/components/auth/AuthCallbackPage';
import LearnerDashboard from '@/pages/dashboard/LearnerDashboard';
import LearnerMessages from '@/pages/dashboard/LearnerMessages';
import LearnerReviews from '@/pages/dashboard/LearnerReviews';
import LearnerSupportTickets from '@/pages/dashboard/LearnerSupportTickets';
import LearnerCreateSupportTicket from '@/pages/dashboard/LearnerCreateSupportTicket';
import LearnerSupportTicketDetail from '@/pages/dashboard/LearnerSupportTicketDetail';
import TutorDashboard from '@/pages/dashboard/TutorDashboard';
import TutorMessages from '@/pages/tutor/TutorMessages';
import TutorSupportTickets from '@/pages/tutor/TutorSupportTickets';
import TutorCreateSupportTicket from '@/pages/tutor/TutorCreateSupportTicket';
import TutorSupportTicketDetail from '@/pages/tutor/TutorSupportTicketDetail';
import CreateTuitionRequest from '@/pages/learner/CreateTuitionRequest';
import { MyTuitionRequestsList, TuitionRequestDetail } from '@/pages/learner/MyTuitionRequests';
import MyProfile from '@/pages/profile/MyProfile';
import MyBookings from '@/pages/bookings/MyBookings';
import TutorBookings from '@/pages/bookings/TutorBookings';
import TutorBookingDetail from '@/pages/bookings/TutorBookingDetail';
import BookingChat from '@/pages/bookings/BookingChat';
import CreateTutorProfile from '@/pages/tutor/CreateTutorProfile';
import TutorProfile from '@/pages/tutor/TutorProfile';
import TutorMyProfile from '@/pages/tutor/TutorMyProfile';
import TutorListing from '@/pages/tutor/TutorListing';
import BrowseTutors from '@/pages/tutor/BrowseTutors';
import ManageAvailability from '@/pages/tutor/ManageAvailability';
import TutorWallet from '@/pages/tutor/TutorWallet';
import TutorVerificationDocuments from '@/pages/tutor/TutorVerificationDocuments';
import BrowseTuitionRequests from '@/pages/tutor/BrowseTuitionRequests';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminTutorVerification from '@/pages/admin/AdminTutorVerification';
import AdminDbsVerification from '@/pages/admin/AdminDbsVerification';
import AdminFinancials from '@/pages/admin/AdminFinancials';
import AdminChatViewer from '@/pages/admin/AdminChatViewer';
import AdminAuditLog from '@/pages/admin/AdminAuditLog';
import AdminConfig from '@/pages/admin/AdminConfig';
import AdminReportedReviews from '@/pages/admin/AdminReportedReviews';
import AdminDisputes from '@/pages/admin/AdminDisputes';
import AdminDisputeDetail from '@/pages/admin/AdminDisputeDetail';
import AdminWithdrawals from '@/pages/admin/AdminWithdrawals';
import AdminWithdrawalDetail from '@/pages/admin/AdminWithdrawalDetail';
import AdminSupportTickets from '@/pages/admin/AdminSupportTickets';
import AdminSupportTicketDetail from '@/pages/admin/AdminSupportTicketDetail';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminLayout from '@/layouts/AdminLayout';
import LearnerLayout from '@/layouts/LearnerLayout';
import TutorLayout from '@/layouts/TutorLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnBoardingScreen from './pages/auth/OnBoardingScreen';
import AgeConsent from './pages/auth/AgeConsent';
import Policy from './pages/Policy';

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
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="withdrawals/:id" element={<AdminWithdrawalDetail />} />
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
