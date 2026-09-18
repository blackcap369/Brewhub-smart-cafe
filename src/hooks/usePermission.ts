import { useAuth } from '../hooks/useAuth';
import { hasPermission, canAccessRoute, type UserRole } from '../utils/rbac';

/**
 * Custom hook for checking permissions
 */
export function usePermission() {
  const { user } = useAuth();
  
  const userRole = user?.user_metadata?.role as UserRole | undefined;
  
  /**
   * Check if user has a specific permission
   */
  const checkPermission = (resource: string, action: string): boolean => {
    if (!userRole) {
      return false;
    }
    return hasPermission(userRole, resource, action);
  };
  
  /**
   * Check if user can access a route
   */
  const checkRouteAccess = (route: string): boolean => {
    if (!userRole) {
      return false;
    }
    return canAccessRoute(userRole, route);
  };
  
  /**
   * Check if user is owner
   */
  const isOwner = userRole === 'owner';
  
  /**
   * Check if user is manager or owner
   */
  const isManagerOrAbove = userRole === 'owner' || userRole === 'manager';
  
  /**
   * Check if user is staff or above
   */
  const isStaffOrAbove = userRole === 'owner' || userRole === 'manager' || userRole === 'staff';
  
  /**
   * Check if user is kitchen staff
   */
  const isKitchen = userRole === 'kitchen';
  
  /**
   * Check if user is customer
   */
  const isCustomer = userRole === 'customer';
  
  return {
    role: userRole,
    checkPermission,
    checkRouteAccess,
    isOwner,
    isManagerOrAbove,
    isStaffOrAbove,
    isKitchen,
    isCustomer,
    // Convenience permission checks
    canViewMenu: checkPermission('menu', 'view'),
    canEditMenu: checkPermission('menu', 'edit'),
    canViewOrders: checkPermission('orders', 'view'),
    canUpdateOrders: checkPermission('orders', 'update_status'),
    canViewAnalytics: checkPermission('analytics', 'view'),
    canViewCustomers: checkPermission('customers', 'view'),
    canManageCustomers: checkPermission('customers', 'manage'),
    canViewBroadcasts: checkPermission('broadcasts', 'view'),
    canCreateBroadcasts: checkPermission('broadcasts', 'create'),
    canViewFeedback: checkPermission('feedback', 'view'),
    canRespondFeedback: checkPermission('feedback', 'respond'),
    canViewStaff: checkPermission('staff', 'view'),
    canManageStaff: checkPermission('staff', 'manage'),
    canViewSettings: checkPermission('settings', 'view'),
    canManageSettings: checkPermission('settings', 'manage'),
    canViewKitchen: checkPermission('kitchen', 'view'),
    canUpdateKitchen: checkPermission('kitchen', 'update_status'),
  };
}
