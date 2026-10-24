/**
 * ProtectedRoute.jsx
 * Wraps routes that require authentication and optionally a specific role.
 * Unauthenticated users → /login
 * Wrong role → /unauthorized
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage message="Checking session…" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
