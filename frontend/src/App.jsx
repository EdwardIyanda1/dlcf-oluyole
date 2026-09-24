// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckInPage from './pages/CheckInPage';
import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminPrograms from './pages/admin/AdminPrograms';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminParticipants from './pages/admin/AdminParticipants';
import AdminMessaging from './pages/admin/AdminMessaging';
import NotFoundPage from './pages/NotFoundPage';
import AdminReports from './pages/admin/AdminReports';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import Footer from './components/Footer';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<><Header /><LandingPage /><Footer /></>} />
        <Route path="/register" element={<><Header /><RegistrationPage /><Footer /></>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin Section */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="messaging" element={<AdminMessaging />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;