import { Navigate } from 'react-router-dom';
import { auth } from '../api';

/**
 * Guards a route behind login, and optionally behind a set of permission
 * levels. Pass `roles` (e.g. ['admin', 'usher']) to restrict a route to
 * specific levels; omit it to just require any logged-in account.
 */
export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('dlcf_token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roles && roles.length > 0) {
    const role = auth.getUser()?.role;
    if (!roles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
