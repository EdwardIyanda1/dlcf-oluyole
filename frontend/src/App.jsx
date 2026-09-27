// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CheckInPage from "./pages/CheckInPage";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminParticipants from "./pages/admin/AdminParticipants";
import AdminMessaging from "./pages/admin/AdminMessaging";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFoundPage from "./pages/NotFoundPage";
import AdminReports from "./pages/admin/AdminReports";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import Footer from "./components/Footer";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth } from "./api";

// Admins land on the Overview. Ushers and the Registration Unit don't have
// an Overview to see, so send them straight to the tool they actually use.
function AdminIndex() {
  const role = auth.getUser()?.role;
  if (role === "admin") return <AdminOverview />;
  if (role === "usher") return <Navigate to="/admin/attendance" replace />;
  if (role === "registration")
    return <Navigate to="/admin/participants" replace />;
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <LandingPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Header />
              <RegistrationPage />
              <Footer />
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin section: only Admin, Registration Unit, and Usher accounts get past the door. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "registration", "usher"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route
            path="programs"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute roles={["admin", "usher"]}>
                <AdminAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="participants"
            element={
              <ProtectedRoute roles={["admin", "registration"]}>
                <AdminParticipants />
              </ProtectedRoute>
            }
          />
          <Route
            path="messaging"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminMessaging />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
