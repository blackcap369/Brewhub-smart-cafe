import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccessRoute, getRoleRedirect, hasPermission, type UserRole } from '../utils/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: { resource: string; action: string };
}

/**
 * Route guard component for role-based access control
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const userRole = user.user_metadata?.role as UserRole | undefined;
  
  // Check role-based access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!userRole || !roles.includes(userRole)) {
      // Redirect to appropriate page based on role
      const redirectPath = userRole ? getRoleRedirect(userRole) : '/login';
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Check route-based access
  if (userRole && !canAccessRoute(userRole, location.pathname)) {
    const redirectPath = getRoleRedirect(userRole);
    return <Navigate to={redirectPath} replace />;
  }
  
  // Check specific permission
  if (requiredPermission && userRole) {
    if (!hasPermission(userRole, requiredPermission.resource, requiredPermission.action)) {
      const redirectPath = getRoleRedirect(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole | UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
