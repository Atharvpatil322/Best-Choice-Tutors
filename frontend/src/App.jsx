import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from '@/contexts/SocketContext';
import LandingPage from '@/components/landing/LandingPage';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallbackPage from '@/components/auth/AuthCallbackPage';
import LearnerDashboard from '@/pages/dashboard/LearnerDashboard';
import TutorDashboard from '@/pages/dashboard/TutorDashboard';
import MyProfile from '@/pages/profile/MyProfile';
import MyBookings from '@/pages/bookings/MyBookings';
import CreateTutorProfile from '@/pages/tutor/CreateTutorProfile';
import TutorProfile from '@/pages/tutor/TutorProfile';
import TutorListing from '@/pages/tutor/TutorListing';
import BrowseTutors from '@/pages/tutor/BrowseTutors';
import ManageAvailability from '@/pages/tutor/ManageAvailability';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/tutors" element={<TutorListing />} />
        <Route path="/browse-tutors" element={<BrowseTutors />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
        
        {/* Protected Routes */}
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
              <MyProfile />
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
      </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
