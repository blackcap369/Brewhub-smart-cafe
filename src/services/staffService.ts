import { supabase } from './supabase';
import type { UserRole } from '../utils/rbac';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  invited_by?: string;
  created_at: string;
  last_login_at?: string;
  permissions?: Record<string, boolean>;
}

export interface StaffInvite {
  phone: string;
  role: UserRole;
  name?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  created_at: string;
}

/**
 * Get all staff members for a cafe
 */
export async function getStaffMembers(cafeId: string): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('cafe_id', cafeId)
    .in('role', ['owner', 'manager', 'staff', 'kitchen'])
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Invite a new staff member
 */
export async function inviteStaff(
  cafeId: string,
  invite: StaffInvite,
  invitedBy: string
): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', invite.phone)
      .eq('cafe_id', cafeId)
      .single();
    
    if (existingUser) {
      return { success: false, error: 'User with this phone number already exists' };
    }
    
    // Create new staff member
    const { data, error } = await supabase
      .from('users')
      .insert({
        cafe_id: cafeId,
        phone: invite.phone,
        name: invite.name || 'Staff Member',
        role: invite.role,
        is_active: true,
        invited_by: invitedBy,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log the invitation
    await logActivity(cafeId, invitedBy, 'invite', 'staff', {
      staff_id: data.id,
      staff_name: data.name,
      role: invite.role,
    });
    
    // TODO: Send SMS invitation
    // await sendStaffInviteSMS(invite.phone, cafeId);
    
    return { success: true, staff: data };
  } catch (error: any) {
    console.error('Error inviting staff:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update staff member role
 */
export async function updateStaffRole(
  staffId: string,
  newRole: UserRole,
  updatedBy: string,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', staffId);
    
    if (error) throw error;
    
    // Log the role change
    await logActivity(cafeId, updatedBy, 'update_role', 'staff', {
      staff_id: staffId,
      new_role: newRole,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating staff role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate staff member
 */
export async function deactivateStaff(
  staffId: string,
  deactivatedBy: string,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', staffId);
    
    if (error) throw error;
    
    // Log the deactivation
    await logActivity(cafeId, deactivatedBy, 'deactivate', 'staff', {
      staff_id: staffId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deactivating staff:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reactivate staff member
 */
export async function reactivateStaff(
  staffId: string,
  reactivatedBy: string,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', staffId);
    
    if (error) throw error;
    
    // Log the reactivation
    await logActivity(cafeId, reactivatedBy, 'reactivate', 'staff', {
      staff_id: staffId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error reactivating staff:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get staff activity log
 */
export async function getStaffActivity(
  cafeId: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      users:user_id (name)
    `)
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (data || []).map((log: any) => ({
    id: log.id,
    user_id: log.user_id,
    user_name: log.users?.name || 'Unknown',
    action: log.action,
    resource: log.resource,
    details: log.details,
    created_at: log.created_at,
  }));
}

/**
 * Log staff activity
 */
export async function logActivity(
  cafeId: string,
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('activity_log')
      .insert({
        cafe_id: cafeId,
        user_id: userId,
        action,
        resource,
        details: details || {},
      });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging shouldn't break the main operation
  }
}

/**
 * Get staff performance metrics
 */
export async function getStaffPerformance(
  cafeId: string,
  staffId: string,
  startDate: string,
  endDate: string
): Promise<{
  ordersHandled: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}> {
  // Get orders handled by this staff member
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, completed_at')
    .eq('cafe_id', cafeId)
    .eq('handled_by', staffId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  const ordersHandled = orders?.length || 0;
  
  // Calculate average response time (time from order creation to completion)
  let avgResponseTime = 0;
  if (orders && orders.length > 0) {
    const responseTimes = orders
      .filter(o => o.completed_at)
      .map(o => {
        const created = new Date(o.created_at).getTime();
        const completed = new Date(o.completed_at!).getTime();
        return (completed - created) / 1000 / 60; // in minutes
      });
    
    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }
  
  // Get customer satisfaction (average rating from feedback)
  const { data: feedback } = await supabase
    .from('feedback')
    .select('rating')
    .eq('cafe_id', cafeId)
    .eq('staff_id', staffId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  let customerSatisfaction = 0;
  if (feedback && feedback.length > 0) {
    customerSatisfaction = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
  }
  
  return {
    ordersHandled,
    avgResponseTime: Math.round(avgResponseTime),
    customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
  };
}

/**
 * Send staff invitation SMS
 */
export async function sendStaffInviteSMS(
  phone: string,
  cafeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get cafe details
    const { data: cafe } = await supabase
      .from('cafes')
      .select('name')
      .eq('id', cafeId)
      .single();
    
    const inviteLink = `${window.location.origin}/staff/accept?cafe=${cafeId}`;
    const message = `You've been invited to join ${cafe?.name || 'our team'} on BrewHub! Click here to accept: ${inviteLink}`;
    
    // TODO: Integrate with SMS service (e.g., Twilio, MSG91)
    // await smsService.send(phone, message);
    
    console.log('SMS invitation sent:', { phone, message });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept staff invitation
 */
export async function acceptStaffInvite(
  phone: string,
  cafeId: string,
  otp: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Verify OTP
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    
    if (authError) throw authError;
    
    // Get staff member
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('cafe_id', cafeId)
      .single();
    
    if (staffError || !staff) {
      throw new Error('Staff member not found');
    }
    
    // Update auth_user_id to link with authenticated user
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: authData.user?.id })
      .eq('id', staff.id);
    
    if (updateError) throw updateError;
    
    return { success: true, user: staff };
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return { success: false, error: error.message };
  }
}
