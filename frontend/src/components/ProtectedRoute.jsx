import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('dlcf_token');
  
  if (!token) {
    // Redirect them to the login page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return children;
}