import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/shared/Layout/Layout';
import AdminLayout from '@/components/shared/Layout/AdminLayout';
import BabysitterLayout from '@/layouts/BabysitterLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ScheduleVisit from '@/pages/ScheduleVisit';
import Gallery from '@/pages/Gallery';
import AccountTypeSelection from '@/pages/AccountTypeSelection';

// Admin Pages
import AdminHome from '@/pages/admin/AdminHome';
import UserManagement from '@/pages/admin/UserManagement';
import ChildManagement from '@/pages/admin/ChildManagement';
import GuardianManagement from '@/pages/admin/GuardianManagement';
import Schedule from '@/pages/admin/Schedule';
import Payments from '@/pages/admin/Payments';
import ChildPayment from '@/pages/admin/ChildPayment';
import BabysitterPaymentManagement from '@/pages/admin/BabysitterPaymentManagement';
import Reports from '@/pages/admin/Reports';
import SystemSettings from '@/pages/admin/SystemSettings';
import Notifications from '@/pages/admin/Notifications';
import Analytics from '@/pages/admin/Analytics';
import BabysitterRegistration from '@/pages/admin/BabysitterRegistration';
import ChildRegistration from '@/pages/admin/ChildRegistration';
import Attendance from '@/pages/admin/Attendance';
import Communications from '@/pages/admin/Communications';
import Security from '@/pages/admin/Security';
import AdminProfile from '@/pages/admin/AdminProfile';
import DataManagement from '@/pages/admin/DataManagement';
import BabysitterManagement from '@/pages/admin/BabysitterManagement';
import BabysitterSchedule from '@/pages/admin/BabysitterSchedule';
import BabysitterPayments from '@/pages/admin/BabysitterPayments';
import ParentManagement from '@/pages/admin/GuardianManagement';
import Settings from '@/pages/admin/SystemSettings';
import BabysitterUpdate from '@/pages/admin/BabysitterUpdate';
import IncidentManagement from '@/pages/admin/IncidentManagement';
import MatchAnalysis from '@/pages/admin/MatchAnalysis';

// Babysitter Pages
import BabysitterHome from '@/pages/babysitter/BabysitterHome';
import BabysitterProfile from '@/pages/babysitter/BabysitterProfile';
import MySchedule from '@/pages/babysitter/MySchedule';
import ChildDetail from '@/pages/babysitter/ChildDetail';
import BabysitterReports from '@/pages/babysitter/BabysitterReports';
import BabysitterNotifications from '@/pages/babysitter/BabysitterNotifications';
import ChildAttendance from '@/pages/babysitter/ChildAttendance';
import IncidentReport from '@/pages/babysitter/IncidentReport';
import Children from '@/pages/babysitter/Children';
import TrainingAnalysis from '@/pages/babysitter/TrainingAnalysis';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Toaster />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="schedule-visit" element={<ScheduleVisit />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="select-account" element={<AccountTypeSelection />} />
            </Route>

            {/* Team Routes (formerly Admin) */}
            <Route path="/team" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="dashboard" element={<AdminHome />} />
                <Route path="management" element={<ChildManagement />} />
                <Route path="analysis" element={<MatchAnalysis />} />
                <Route path="stats" element={<Analytics />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
            </Route>

            {/* Player Routes (formerly Babysitter) */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={['babysitter']} />}>
              <Route element={<BabysitterLayout />}>
                <Route index element={<BabysitterHome />} />
                <Route path="training" element={<TrainingAnalysis />} />
                <Route path="skills" element={<ChildAttendance />} />
                <Route path="profile" element={<BabysitterProfile />} />
                <Route path="notifications" element={<BabysitterNotifications />} />
              </Route>
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 