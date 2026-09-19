import { supabase } from './supabase';

export interface Reservation {
  id: string;
  cafe_id: string;
  customer_id: string | null;
  table_id: string | null;
  reservation_date: string;
  time_slot: string;
  guests: number;
  status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  special_requests: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  duration_minutes: number;
  deposit_amount: number;
  deposit_paid: boolean;
  reminder_sent_2hr: boolean;
  reminder_sent_30min: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  marked_no_show_at: string | null;
}

export interface CreateReservationInput {
  cafe_id: string;
  customer_id?: string;
  table_id?: string;
  reservation_date: string;
  time_slot: string;
  guests: number;
  special_requests?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface TimeSlot {
  time_slot: string;
  available_tables: number;
  total_tables: number;
}

export interface TableAvailability {
  table_id: string;
  table_no: number;
  seats: number;
  is_available: boolean;
}

/**
 * Create a new reservation
 */
export async function createReservation(
  input: CreateReservationInput
): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          cafe_id: input.cafe_id,
          customer_id: input.customer_id || null,
          table_id: input.table_id || null,
          reservation_date: input.reservation_date,
          time_slot: input.time_slot,
          guests: input.guests,
          special_requests: input.special_requests || null,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          customer_email: input.customer_email || null,
          duration_minutes: input.duration_minutes || 90,
          notes: input.notes || null,
          status: 'confirmed',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, reservation: data };
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get reservations for a cafe on a specific date
 */
export async function getReservations(
  cafeId: string,
  date: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'checked_in'])
      .order('time_slot', { ascending: true });

    if (error) throw error;

    return { success: true, reservations: data };
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all reservations for a customer
 */
export async function getCustomerReservations(
  customerId: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('customer_id', customerId)
      .order('reservation_date', { ascending: false })
      .order('time_slot', { ascending: false });

    if (error) throw error;

    return { success: true, reservations: data };
  } catch (error: any) {
    console.error('Error fetching customer reservations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check in a reservation
 */
export async function checkInReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error checking in reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete a reservation
 */
export async function completeReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error completing reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available time slots for a date
 */
export async function getAvailableTimeSlots(
  cafeId: string,
  date: string,
  guests: number,
  openingTime: string = '08:00:00',
  closingTime: string = '22:00:00'
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_available_time_slots', {
      p_cafe_id: cafeId,
      p_date: date,
      p_guests: guests,
      p_opening_time: openingTime,
      p_closing_time: closingTime,
      p_slot_duration_minutes: 30,
      p_reservation_duration_minutes: 90,
      p_buffer_minutes: 15,
    });

    if (error) throw error;

    return { success: true, slots: data };
  } catch (error: any) {
    console.error('Error fetching available time slots:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check table availability for a specific time slot
 */
export async function checkTableAvailability(
  cafeId: string,
  date: string,
  timeSlot: string,
  guests: number
): Promise<{ success: boolean; tables?: TableAvailability[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('check_table_availability', {
      p_cafe_id: cafeId,
      p_date: date,
      p_time_slot: timeSlot,
      p_guests: guests,
      p_duration_minutes: 90,
      p_buffer_minutes: 15,
    });

    if (error) throw error;

    return { success: true, tables: data };
  } catch (error: any) {
    console.error('Error checking table availability:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign table to reservation
 */
export async function assignTable(
  reservationId: string,
  tableId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({
        table_id: tableId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error assigning table:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reservation reminder
 */
export async function sendReminder(
  reservationId: string,
  reminderType: '2hr' | '30min' | 'confirmation',
  sentVia: 'sms' | 'email' | 'push' | 'in_app'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert reminder record
    const { error: reminderError } = await supabase
      .from('reservation_reminders')
      .insert([
        {
          reservation_id: reservationId,
          reminder_type: reminderType,
          sent_via: sentVia,
          status: 'sent',
        },
      ]);

    if (reminderError) throw reminderError;

    // Update reservation reminder flags
    const updateData: any = { updated_at: new Date().toISOString() };
    if (reminderType === '2hr') updateData.reminder_sent_2hr = true;
    if (reminderType === '30min') updateData.reminder_sent_30min = true;

    const { error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get reservations that need reminders
 */
export async function getReservationsNeedingReminders(
  cafeId: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }> {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    // Get reservations needing 2-hour reminder
    const { data: twoHourReminders, error: twoHourError } = await supabase
      .from('reservations')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('status', 'confirmed')
      .eq('reminder_sent_2hr', false)
      .gte('reservation_date', now.toISOString().split('T')[0])
      .lte('reservation_date', twoHoursLater.toISOString().split('T')[0]);

    if (twoHourError) throw twoHourError;

    // Filter by time
    const currentTime = now.toTimeString().split(' ')[0];
    const twoHourTime = twoHoursLater.toTimeString().split(' ')[0];
    
    const needsTwoHourReminder = twoHourReminders?.filter(r => {
      const reservationTime = r.time_slot;
      return reservationTime >= currentTime && reservationTime <= twoHourTime;
    }) || [];

    // Get reservations needing 30-minute reminder
    const { data: thirtyMinReminders, error: thirtyMinError } = await supabase
      .from('reservations')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('status', 'confirmed')
      .eq('reminder_sent_30min', false)
      .gte('reservation_date', now.toISOString().split('T')[0])
      .lte('reservation_date', thirtyMinutesLater.toISOString().split('T')[0]);

    if (thirtyMinError) throw thirtyMinError;

    const thirtyMinTime = thirtyMinutesLater.toTimeString().split(' ')[0];
    
    const needsThirtyMinReminder = thirtyMinReminders?.filter(r => {
      const reservationTime = r.time_slot;
      return reservationTime >= currentTime && reservationTime <= thirtyMinTime;
    }) || [];

    return {
      success: true,
      reservations: [...needsTwoHourReminder, ...needsThirtyMinReminder],
    };
  } catch (error: any) {
    console.error('Error fetching reservations needing reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark no-shows (call this periodically)
 */
export async function markNoShows(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('mark_no_shows');

    if (error) throw error;

    return { success: true, count: data };
  } catch (error: any) {
    console.error('Error marking no-shows:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get reservation statistics
 */
export async function getReservationStats(
  cafeId: string,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  stats?: {
    total_reservations: number;
    confirmed_count: number;
    checked_in_count: number;
    completed_count: number;
    cancelled_count: number;
    no_show_count: number;
    total_guests: number;
    avg_guests_per_reservation: number;
    no_show_rate: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('get_reservation_stats', {
      p_cafe_id: cafeId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw error;

    return { success: true, stats: data[0] };
  } catch (error: any) {
    console.error('Error fetching reservation stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Join waitlist
 */
export async function joinWaitlist(
  cafeId: string,
  date: string,
  timeSlot: string,
  guests: number,
  customerName: string,
  customerPhone: string,
  customerEmail?: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('reservation_waitlist').insert([
      {
        cafe_id: cafeId,
        customer_id: customerId || null,
        reservation_date: date,
        time_slot: timeSlot,
        guests,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        status: 'waiting',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get waitlist for a date
 */
export async function getWaitlist(
  cafeId: string,
  date: string
): Promise<{ success: boolean; waitlist?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reservation_waitlist')
      .select('*')
      .eq('cafe_id', cafeId)
      .eq('reservation_date', date)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, waitlist: data };
  } catch (error: any) {
    console.error('Error fetching waitlist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update reservation notes
 */
export async function updateReservationNotes(
  reservationId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating reservation notes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get upcoming reservations for a customer
 */
export async function getUpcomingReservations(
  customerId: string
): Promise<{ success: boolean; reservations?: Reservation[]; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('customer_id', customerId)
      .in('status', ['confirmed', 'checked_in'])
      .gte('reservation_date', today)
      .order('reservation_date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) throw error;

    return { success: true, reservations: data };
  } catch (error: any) {
    console.error('Error fetching upcoming reservations:', error);
    return { success: false, error: error.message };
  }
}
