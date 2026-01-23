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
import TeamLayout from '@/components/shared/Layout/TeamLayout';
import PlayerLayout from '@/layouts/PlayerLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import ScheduleVisit from '@/pages/ScheduleVisit';
import Gallery from '@/pages/Gallery';
import AccountTypeSelection from '@/pages/AccountTypeSelection';

// Team Pages
import TeamHome from '@/pages/team/TeamHome';
import UserManagement from '@/pages/team/UserManagement';
import PlayerManagement from '@/pages/team/PlayerManagement';
import ContactManagement from '@/pages/team/ContactManagement';
import Schedule from '@/pages/team/Schedule';
import Payments from '@/pages/team/Payments';
import ChildPayment from '@/pages/team/ChildPayment';
import BabysitterPaymentManagement from '@/pages/team/BabysitterPaymentManagement';
import Reports from '@/pages/team/Reports';
import SystemSettings from '@/pages/team/SystemSettings';
import Notifications from '@/pages/team/Notifications';
import Analytics from '@/pages/team/Analytics';
import BabysitterRegistration from '@/pages/team/BabysitterRegistration';
import ChildRegistration from '@/pages/team/ChildRegistration';
import Attendance from '@/pages/team/Attendance';
import Communications from '@/pages/team/Communications';
import Security from '@/pages/team/Security';
import TeamProfile from '@/pages/team/TeamProfile';
import DataManagement from '@/pages/team/DataManagement';
import BabysitterManagement from '@/pages/team/BabysitterManagement';
import BabysitterSchedule from '@/pages/team/BabysitterSchedule';
import BabysitterPayments from '@/pages/team/BabysitterPayments';
import ParentManagement from '@/pages/team/ContactManagement';
import Settings from '@/pages/team/SystemSettings';
import BabysitterUpdate from '@/pages/team/BabysitterUpdate';
import IncidentManagement from '@/pages/team/IncidentManagement';
import MatchAnalysis from '@/pages/team/MatchAnalysis';

// Player Pages
import PlayerHome from '@/pages/player/PlayerHome';
import PlayerProfile from '@/pages/player/PlayerProfile';
import MySchedule from '@/pages/player/MySchedule';
import ChildDetail from '@/pages/player/ChildDetail';
import PlayerReports from '@/pages/player/PlayerReports';
import PlayerNotifications from '@/pages/player/PlayerNotifications';
import ChildAttendance from '@/pages/player/ChildAttendance';
import IncidentReport from '@/pages/player/IncidentReport';
import Children from '@/pages/player/Children';
import TrainingAnalysis from '@/pages/player/TrainingAnalysis';

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
              <Route element={<TeamLayout />}>
                <Route index element={<TeamHome />} />
                <Route path="dashboard" element={<TeamHome />} />
                <Route path="management" element={<PlayerManagement />} />
                <Route path="analysis" element={<MatchAnalysis />} />
                <Route path="stats" element={<Analytics />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<TeamProfile />} />
              </Route>
            </Route>

            {/* Player Routes (formerly Babysitter) */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={['babysitter']} />}>
              <Route element={<PlayerLayout />}>
                <Route index element={<PlayerHome />} />
                <Route path="training" element={<TrainingAnalysis />} />
                <Route path="skills" element={<ChildAttendance />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="notifications" element={<PlayerNotifications />} />
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