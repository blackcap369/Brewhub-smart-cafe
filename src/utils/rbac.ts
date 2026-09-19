// Role-Based Access Control (RBAC) System

export type UserRole = 'owner' | 'manager' | 'staff' | 'kitchen' | 'customer';

export interface Permission {
  resource: string;
  action: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

// Permission matrix for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    // Full access - all permissions
    { resource: '*', action: '*' },
  ],
  manager: [
    // Menu management
    { resource: 'menu', action: 'view' },
    { resource: 'menu', action: 'create' },
    { resource: 'menu', action: 'edit' },
    { resource: 'menu', action: 'delete' },
    
    // Order management
    { resource: 'orders', action: 'view' },
    { resource: 'orders', action: 'update_status' },
    { resource: 'orders', action: 'cancel' },
    
    // Analytics
    { resource: 'analytics', action: 'view' },
    
    // Customers
    { resource: 'customers', action: 'view' },
    { resource: 'customers', action: 'manage' },
    
    // Broadcasts
    { resource: 'broadcasts', action: 'view' },
    { resource: 'broadcasts', action: 'create' },
    { resource: 'broadcasts', action: 'send' },
    
    // Feedback
    { resource: 'feedback', action: 'view' },
    { resource: 'feedback', action: 'respond' },
    
    // Birthday
    { resource: 'birthday', action: 'view' },
    { resource: 'birthday', action: 'configure' },
    
    // Staff (limited)
    { resource: 'staff', action: 'view' },
    
    // Floor map
    { resource: 'floor_map', action: 'view' },
    { resource: 'floor_map', action: 'manage' },
  ],
  staff: [
    // Orders (limited)
    { resource: 'orders', action: 'view' },
    { resource: 'orders', action: 'update_status' },
    
    // Menu (view only)
    { resource: 'menu', action: 'view' },
    
    // Analytics (limited)
    { resource: 'analytics', action: 'view_basic' },
  ],
  kitchen: [
    // Kitchen display only
    { resource: 'kitchen', action: 'view' },
    { resource: 'kitchen', action: 'update_status' },
  ],
  customer: [
    // Customer actions only
    { resource: 'menu', action: 'view' },
    { resource: 'orders', action: 'create' },
    { resource: 'orders', action: 'view_own' },
    { resource: 'cart', action: 'manage' },
    { resource: 'loyalty', action: 'view_own' },
    { resource: 'feedback', action: 'create' },
  ],
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full access to all features and settings',
  manager: 'Access to menu, orders, analytics, and customer management',
  staff: 'Limited access to orders and basic operations',
  kitchen: 'Access to kitchen display system only',
  customer: 'Customer-facing features only',
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  
  // Owner has all permissions
  if (role === 'owner') {
    return true;
  }
  
  // Check for exact match
  return permissions.some(
    (perm) =>
      (perm.resource === resource || perm.resource === '*') &&
      (perm.action === action || perm.action === '*')
  );
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission> = {
    '/admin': { resource: 'admin', action: 'view' },
    '/admin/floor-map': { resource: 'floor_map', action: 'view' },
    '/admin/menu': { resource: 'menu', action: 'view' },
    '/admin/orders': { resource: 'orders', action: 'view' },
    '/admin/customers': { resource: 'customers', action: 'view' },
    '/admin/analytics': { resource: 'analytics', action: 'view' },
    '/admin/broadcasts': { resource: 'broadcasts', action: 'view' },
    '/admin/feedback': { resource: 'feedback', action: 'view' },
    '/admin/birthday': { resource: 'birthday', action: 'view' },
    '/admin/staff': { resource: 'staff', action: 'view' },
    '/admin/settings': { resource: 'settings', action: 'view' },
    '/kitchen': { resource: 'kitchen', action: 'view' },
    '/kitchen-dashboard': { resource: 'kitchen', action: 'view' },
    '/menu': { resource: 'menu', action: 'view' },
    '/customer': { resource: 'menu', action: 'view' },
  };
  
  const requiredPermission = routePermissions[route];
  if (!requiredPermission) {
    return false;
  }
  
  return hasPermission(role, requiredPermission.resource, requiredPermission.action);
}

/**
 * Get redirect path based on role
 */
export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case 'owner':
    case 'manager':
      return '/admin';
    case 'staff':
      return '/admin/orders';
    case 'kitchen':
      return '/kitchen-dashboard';
    case 'customer':
      return '/menu';
    default:
      return '/';
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role];
}

/**
 * Check if role can manage another role
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    owner: 4,
    manager: 3,
    staff: 2,
    kitchen: 1,
    customer: 0,
  };
  
  return hierarchy[managerRole] > hierarchy[targetRole];
}

/**
 * Get available roles for a manager
 */
export function getAvailableRoles(currentRole: UserRole): UserRole[] {
  const allRoles: UserRole[] = ['owner', 'manager', 'staff', 'kitchen', 'customer'];
  
  if (currentRole === 'owner') {
    return allRoles;
  }
  
  if (currentRole === 'manager') {
    return ['staff', 'kitchen'];
  }
  
  return [];
}

/**
 * Permission check hook helper
 */
export function checkPermission(
  userRole: UserRole | undefined,
  resource: string,
  action: string
): boolean {
  if (!userRole) {
    return false;
  }
  
  return hasPermission(userRole, resource, action);
}
