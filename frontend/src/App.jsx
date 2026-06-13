// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckInPage from './pages/CheckInPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminPrograms from './pages/admin/AdminPrograms';
import AdminParticipants from './pages/admin/AdminParticipants';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<><Header /><LandingPage /></>} />
        <Route path="/register" element={<><Header /><RegistrationPage /></>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        
        {/* Admin Section */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="participants" element={<AdminParticipants />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;