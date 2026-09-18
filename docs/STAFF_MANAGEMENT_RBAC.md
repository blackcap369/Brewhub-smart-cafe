# Staff Management & Role-Based Access Control (RBAC)

## Overview

BrewHub implements a comprehensive role-based access control system that allows cafe owners to manage staff members with different permission levels. The system supports 5 user roles with granular permissions for each resource and action.

## User Roles

### 1. Owner
- **Description**: Full access to all features and settings
- **Permissions**: All resources and actions
- **Capabilities**:
  - Manage all staff members
  - Configure cafe settings
  - View all analytics
  - Manage billing and subscriptions
  - Full menu management
  - Complete order management
  - Access to all reports

### 2. Manager
- **Description**: Access to menu, orders, analytics, and customer management
- **Permissions**: Most administrative features except settings and billing
- **Capabilities**:
  - View and manage menu items
  - Manage orders (view, update status, cancel)
  - View analytics and reports
  - Manage customers
  - Create and send broadcasts
  - Respond to feedback
  - Configure birthday offers
  - View staff (but not manage roles)
  - Manage floor map

### 3. Staff
- **Description**: Limited access to orders and basic operations
- **Permissions**: Order management and basic viewing
- **Capabilities**:
  - View orders
  - Update order status
  - View menu (read-only)
  - View basic analytics

### 4. Kitchen
- **Description**: Access to kitchen display system only
- **Permissions**: Kitchen-specific operations
- **Capabilities**:
  - View kitchen display
  - Update order status in kitchen

### 5. Customer
- **Description**: Customer-facing features only
- **Permissions**: Customer operations
- **Capabilities**:
  - View menu
  - Create orders
  - View own orders
  - Manage cart
  - View own loyalty points
  - Submit feedback

## Permission Matrix

| Resource | Action | Owner | Manager | Staff | Kitchen | Customer |
|----------|--------|-------|---------|-------|---------|----------|
| menu | view | ✓ | ✓ | ✓ | - | ✓ |
| menu | create | ✓ | ✓ | - | - | - |
| menu | edit | ✓ | ✓ | - | - | - |
| menu | delete | ✓ | ✓ | - | - | - |
| orders | view | ✓ | ✓ | ✓ | - | - |
| orders | view_own | ✓ | ✓ | ✓ | - | ✓ |
| orders | create | ✓ | ✓ | ✓ | - | ✓ |
| orders | update_status | ✓ | ✓ | ✓ | - | - |
| orders | cancel | ✓ | ✓ | - | - | - |
| analytics | view | ✓ | ✓ | - | - | - |
| analytics | view_basic | ✓ | ✓ | ✓ | - | - |
| customers | view | ✓ | ✓ | - | - | - |
| customers | manage | ✓ | ✓ | - | - | - |
| broadcasts | view | ✓ | ✓ | - | - | - |
| broadcasts | create | ✓ | ✓ | - | - | - |
| broadcasts | send | ✓ | ✓ | - | - | - |
| feedback | view | ✓ | ✓ | - | - | - |
| feedback | respond | ✓ | ✓ | - | - | - |
| feedback | create | ✓ | ✓ | ✓ | - | ✓ |
| birthday | view | ✓ | ✓ | - | - | - |
| birthday | configure | ✓ | ✓ | - | - | - |
| staff | view | ✓ | ✓ | - | - | - |
| staff | manage | ✓ | - | - | - | - |
| floor_map | view | ✓ | ✓ | - | - | - |
| floor_map | manage | ✓ | ✓ | - | - | - |
| kitchen | view | ✓ | ✓ | ✓ | ✓ | - |
| kitchen | update_status | ✓ | ✓ | ✓ | ✓ | - |
| settings | view | ✓ | - | - | - | - |
| settings | manage | ✓ | - | - | - | - |
| cart | manage | ✓ | ✓ | ✓ | - | ✓ |
| loyalty | view_own | ✓ | ✓ | ✓ | - | ✓ |

## Database Schema

### Users Table (Extended)

```sql
ALTER TABLE users 
ADD COLUMN invited_by UUID REFERENCES auth.users(id),
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
```

**Columns:**
- `invited_by`: User ID who invited this staff member
- `is_active`: Whether the staff member is currently active
- `permissions`: Custom permissions override (JSONB)

### Role Permissions Table

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'kitchen', 'customer')),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);
```

**Purpose:** Defines the permission matrix for each role

## Staff Invitation Flow

### 1. Owner Invites Staff
```typescript
import { inviteStaff } from './services/staffService';

await inviteStaff(
  cafeId,
  {
    phone: '+1234567890',
    name: 'John Doe',
    role: 'staff'
  },
  ownerUserId
);
```

### 2. SMS Invitation Sent
- System sends SMS with invitation link
- Link includes cafe ID and phone number
- Link expires after 24 hours

### 3. Staff Accepts Invitation
```typescript
import { acceptStaffInvite } from './services/staffService';

const result = await acceptStaffInvite(
  '+1234567890',
  cafeId,
  otpCode
);
```

### 4. Staff Member Created
- User record created with assigned role
- `invited_by` field set to owner's user ID
- `is_active` set to true
- Staff can now log in and access appropriate features

## Staff Management Operations

### View All Staff
```typescript
import { getStaffMembers } from './services/staffService';

const staff = await getStaffMembers(cafeId);
```

### Update Staff Role
```typescript
import { updateStaffRole } from './services/staffService';

await updateStaffRole(
  staffId,
  'manager',  // new role
  updatedByUserId,
  cafeId
);
```

### Deactivate Staff
```typescript
import { deactivateStaff } from './services/staffService';

await deactivateStaff(staffId, deactivatedByUserId, cafeId);
```

### Reactivate Staff
```typescript
import { reactivateStaff } from './services/staffService';

await reactivateStaff(staffId, reactivatedByUserId, cafeId);
```

## Activity Tracking

All staff actions are logged in the `activity_log` table:

```typescript
import { logActivity } from './services/staffService';

await logActivity(
  cafeId,
  userId,
  'update_role',  // action
  'staff',        // resource
  {
    staff_id: targetStaffId,
    new_role: 'manager'
  }
);
```

### View Activity Log
```typescript
import { getStaffActivity } from './services/staffService';

const activity = await getStaffActivity(cafeId, 50);
```

## Staff Performance Metrics

```typescript
import { getStaffPerformance } from './services/staffService';

const performance = await getStaffPerformance(
  cafeId,
  staffId,
  '2024-01-01',  // start date
  '2024-01-31'   // end date
);

// Returns:
// {
//   ordersHandled: 45,
//   avgResponseTime: 12,  // minutes
//   customerSatisfaction: 4.5  // out of 5
// }
```

## Permission Checking

### Using the usePermission Hook

```typescript
import { usePermission } from './hooks/usePermission';

function MyComponent() {
  const {
    role,
    isOwner,
    isManagerOrAbove,
    canEditMenu,
    canViewAnalytics,
    checkPermission
  } = usePermission();
  
  // Check specific permission
  if (canEditMenu) {
    // Show edit button
  }
  
  // Check custom permission
  if (checkPermission('broadcasts', 'create')) {
    // Show create broadcast button
  }
  
  // Role-based rendering
  if (isOwner) {
    // Show owner-only features
  }
}
```

### Using Protected Routes

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// Protect entire route
<ProtectedRoute requiredRole="owner">
  <SettingsPage />
</ProtectedRoute>

// Protect with specific permission
<ProtectedRoute requiredPermission={{ resource: 'menu', action: 'edit' }}>
  <MenuEditor />
</ProtectedRoute>

// Protect with multiple roles
<ProtectedRoute requiredRole={['owner', 'manager']}>
  <AnalyticsPage />
</ProtectedRoute>
```

## Role-Based Redirects

After login, users are redirected based on their role:

```typescript
import { getRoleRedirect } from './utils/rbac';

const redirectPath = getRoleRedirect(userRole);
// owner/manager → '/admin'
// staff → '/admin/orders'
// kitchen → '/kitchen-dashboard'
// customer → '/menu'
```

## Security Features

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Policies check user role and cafe ownership
- Prevents unauthorized data access

### 2. Server-Side Permission Checks
- Edge Functions verify permissions before operations
- Prevents privilege escalation
- Validates user role on every request

### 3. Activity Logging
- All staff actions are logged
- Includes user ID, action, resource, and details
- Viewable by owners in audit trail

### 4. Role Hierarchy
```
owner (level 4)
  ↓
manager (level 3)
  ↓
staff (level 2)
  ↓
kitchen (level 1)
  ↓
customer (level 0)
```

Higher-level roles can manage lower-level roles.

### 5. Permission Validation
```typescript
import { hasPermission, canManageRole } from './utils/rbac';

// Check if user has permission
if (hasPermission('manager', 'menu', 'edit')) {
  // Allow menu editing
}

// Check if manager can manage target role
if (canManageRole('owner', 'manager')) {
  // Owner can manage managers
}
```

## API Reference

### Staff Service Functions

#### `getStaffMembers(cafeId: string): Promise<StaffMember[]>`
Get all staff members for a cafe.

#### `inviteStaff(cafeId: string, invite: StaffInvite, invitedBy: string): Promise<{ success: boolean; staff?: StaffMember; error?: string }>`
Invite a new staff member.

#### `updateStaffRole(staffId: string, newRole: UserRole, updatedBy: string, cafeId: string): Promise<{ success: boolean; error?: string }>`
Update a staff member's role.

#### `deactivateStaff(staffId: string, deactivatedBy: string, cafeId: string): Promise<{ success: boolean; error?: string }>`
Deactivate a staff member.

#### `reactivateStaff(staffId: string, reactivatedBy: string, cafeId: string): Promise<{ success: boolean; error?: string }>`
Reactivate a staff member.

#### `getStaffActivity(cafeId: string, limit?: number): Promise<ActivityLog[]>`
Get activity log for staff actions.

#### `logActivity(cafeId: string, userId: string, action: string, resource: string, details?: Record<string, any>): Promise<void>`
Log a staff activity.

#### `getStaffPerformance(cafeId: string, staffId: string, startDate: string, endDate: string): Promise<{ ordersHandled: number; avgResponseTime: number; customerSatisfaction: number }>`
Get performance metrics for a staff member.

#### `sendStaffInviteSMS(phone: string, cafeId: string): Promise<{ success: boolean; error?: string }>`
Send SMS invitation to staff member.

#### `acceptStaffInvite(phone: string, cafeId: string, otp: string): Promise<{ success: boolean; user?: any; error?: string }>`
Accept staff invitation.

### RBAC Utility Functions

#### `hasPermission(role: UserRole, resource: string, action: string): boolean`
Check if a role has a specific permission.

#### `canAccessRoute(role: UserRole, route: string): boolean`
Check if a role can access a specific route.

#### `getRoleRedirect(role: UserRole): string`
Get the default redirect path for a role.

#### `getRolePermissions(role: UserRole): Permission[]`
Get all permissions for a role.

#### `canManageRole(managerRole: UserRole, targetRole: UserRole): boolean`
Check if a role can manage another role.

#### `getAvailableRoles(currentRole: UserRole): UserRole[]`
Get roles that can be assigned by the current role.

## UI Components

### StaffManagement Component
Located at: `/admin/staff`

**Features:**
- List all staff members with role badges
- Invite new staff via phone number
- Change staff roles
- Deactivate/reactivate staff
- View staff activity
- Performance metrics per staff

**Access:** Owner and Manager roles only

### Language Switcher
Already implemented in header, allows users to switch between 6 languages.

## Testing Checklist

### Manual Testing
- [ ] Owner can invite staff
- [ ] Manager can view staff but not change roles
- [ ] Staff can only view orders
- [ ] Kitchen can only access kitchen display
- [ ] Activity logging works correctly
- [ ] Role changes are logged
- [ ] Deactivated staff cannot log in
- [ ] Permission checks work on all routes
- [ ] RLS policies prevent unauthorized access

### Automated Testing
```typescript
describe('RBAC System', () => {
  it('should check permissions correctly', () => {
    expect(hasPermission('owner', 'menu', 'edit')).toBe(true);
    expect(hasPermission('staff', 'menu', 'edit')).toBe(false);
    expect(hasPermission('manager', 'orders', 'view')).toBe(true);
  });
  
  it('should check route access', () => {
    expect(canAccessRoute('owner', '/admin/settings')).toBe(true);
    expect(canAccessRoute('manager', '/admin/settings')).toBe(false);
    expect(canAccessRoute('kitchen', '/kitchen-dashboard')).toBe(true);
  });
  
  it('should get correct redirect', () => {
    expect(getRoleRedirect('owner')).toBe('/admin');
    expect(getRoleRedirect('kitchen')).toBe('/kitchen-dashboard');
    expect(getRoleRedirect('customer')).toBe('/menu');
  });
});
```

## Best Practices

### 1. Always Check Permissions
```typescript
// Good
if (canEditMenu) {
  <EditButton />
}

// Bad - don't rely on role alone
if (role === 'owner') {
  <EditButton />
}
```

### 2. Use Protected Routes
```typescript
// Protect sensitive routes
<ProtectedRoute requiredRole="owner">
  <SettingsPage />
</ProtectedRoute>
```

### 3. Log All Actions
```typescript
// Log important actions
await logActivity(cafeId, userId, 'delete', 'menu_item', { item_id: id });
```

### 4. Validate on Server
```typescript
// Always validate permissions in Edge Functions
if (!user_has_permission(user_id, 'menu', 'delete')) {
  throw new Error('Unauthorized');
}
```

## Future Enhancements

### Phase 2
- Custom role creation
- Granular permission assignment
- Staff scheduling system
- Performance dashboards
- Staff training modules

### Phase 3
- Multi-cafe staff management
- Cross-cafe permissions
- Staff communication tools
- Shift management
- Payroll integration

## Security Considerations

1. **Never expose permission checks to client only** - Always validate on server
2. **Log all permission changes** - Maintain audit trail
3. **Use RLS policies** - Prevent unauthorized data access
4. **Validate role hierarchy** - Prevent privilege escalation
5. **Regular permission audits** - Review and update permissions

## Support

For issues or questions:
- Check the activity log for debugging
- Review RLS policies in Supabase dashboard
- Verify user roles in database
- Check Edge Function logs

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: ✅ Production Ready
