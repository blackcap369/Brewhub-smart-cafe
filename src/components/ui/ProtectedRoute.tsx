import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: 'owner' | 'staff' | 'customer';
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen text="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && user) {
    const userRole = user.user_metadata?.role as string | undefined;
    if (userRole !== requiredRole && userRole !== 'owner') {
      return <Navigate to="/menu" replace />;
    }
  }

  return <>{children}</>;
}
