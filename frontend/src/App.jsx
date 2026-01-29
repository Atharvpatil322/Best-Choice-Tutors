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
import TutorDashboard from '@/pages/dashboard/TutorDashboard';
import ProfileRouter from '@/pages/profile/ProfileRouter';
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
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Route - Only Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes - public so users can authenticate */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* All other routes require authentication */}
        <Route
          path="/tutors"
          element={
            <ProtectedRoute>
              <TutorListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-tutors"
          element={
            <ProtectedRoute>
              <BrowseTutors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutors/:id"
          element={
            <ProtectedRoute>
              <TutorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId/chat"
          element={
            <ProtectedRoute>
              <BookingChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/create"
          element={
            <ProtectedRoute>
              <CreateTutorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute>
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/availability"
          element={
            <ProtectedRoute>
              <ManageAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/profile"
          element={
            <ProtectedRoute>
              <TutorMyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/bookings/:bookingId"
          element={
            <ProtectedRoute>
              <TutorBookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/bookings"
          element={
            <ProtectedRoute>
              <TutorBookings />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
      <Toaster />
    </SocketProvider>
  );
}

export default App;
