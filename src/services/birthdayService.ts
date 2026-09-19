import { supabase } from './supabase';

export interface BirthdayCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dob: string;
  age: number;
  total_orders: number;
  last_order_date: string | null;
}

export interface BirthdayOffer {
  type: 'free_item' | 'discount';
  item_id?: string;
  item_name?: string;
  discount_percentage?: number;
  valid_hours: number;
}

export interface BirthdayRedemption {
  id: string;
  customer_id: string;
  cafe_id: string;
  order_id: string;
  offer_type: string;
  redeemed_at: string;
}

/**
 * Get customers with birthdays in a date range
 */
export async function getBirthdayCustomers(
  cafeId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; customers?: BirthdayCustomer[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        phone,
        email,
        dob,
        orders:orders(count)
      `)
      .eq('cafe_id', cafeId)
      .eq('role', 'customer')
      .not('dob', 'is', null)
      .gte('dob', startDate.toISOString().split('T')[1])
      .lte('dob', endDate.toISOString().split('T')[1]);

    if (error) throw error;

    const customers: BirthdayCustomer[] = (data || []).map((user: any) => {
      const dob = new Date(user.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        dob: user.dob,
        age,
        total_orders: user.orders?.[0]?.count || 0,
        last_order_date: null,
      };
    });

    return { success: true, customers };
  } catch (error: any) {
    console.error('Error fetching birthday customers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check for today's birthdays
 */
export async function checkTodayBirthdays(
  cafeId: string
): Promise<{ success: boolean; customers?: BirthdayCustomer[]; error?: string }> {
  const today = new Date();
  return getBirthdayCustomers(cafeId, today, today);
}

/**
 * Get upcoming birthdays (next 7 days)
 */
export async function getUpcomingBirthdays(
  cafeId: string
): Promise<{ success: boolean; customers?: BirthdayCustomer[]; error?: string }> {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return getBirthdayCustomers(cafeId, today, nextWeek);
}

/**
 * Get birthday offer configuration for a cafe
 */
export async function getBirthdayOfferConfig(
  cafeId: string
): Promise<{ success: boolean; config?: BirthdayOffer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('cafe_id', cafeId)
      .eq('key', 'birthday_offer')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No config found, return default
        return {
          success: true,
          config: {
            type: 'free_item',
            item_name: 'Free Dessert',
            valid_hours: 24,
          },
        };
      }
      throw error;
    }

    return { success: true, config: data.value as BirthdayOffer };
  } catch (error: any) {
    console.error('Error fetching birthday offer config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update birthday offer configuration
 */
export async function updateBirthdayOfferConfig(
  cafeId: string,
  config: BirthdayOffer
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        cafe_id: cafeId,
        key: 'birthday_offer',
        value: config as any,
        updated_at: new Date().toISOString(),
      })
      .eq('cafe_id', cafeId)
      .eq('key', 'birthday_offer');

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating birthday offer config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send birthday wish notification
 */
export async function sendBirthdayWish(
  customerId: string,
  cafeId: string,
  offer: BirthdayOffer
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('name, phone, email')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Create notification message
    const message = offer.type === 'free_item'
      ? `🎂 Happy Birthday ${customer.name}! Enjoy a free ${offer.item_name} on us today!`
      : `🎂 Happy Birthday ${customer.name}! Enjoy ${offer.discount_percentage}% off your order today!`;

    // Create broadcast for this customer
    const { error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        cafe_id: cafeId,
        title: '🎂 Happy Birthday!',
        message,
        target_audience: 'birthday_this_week',
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: 1,
        delivered_count: 1,
      });

    if (broadcastError) throw broadcastError;

    // Log activity
    await supabase.from('activity_log').insert({
      cafe_id: cafeId,
      user_id: customerId,
      action: 'birthday_wish_sent',
      details: { offer_type: offer.type, message },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending birthday wish:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Track birthday redemption
 */
export async function trackBirthdayRedemption(
  customerId: string,
  cafeId: string,
  orderId: string,
  offerType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('activity_log').insert({
      cafe_id: cafeId,
      user_id: customerId,
      action: 'birthday_redemption',
      details: {
        order_id: orderId,
        offer_type: offerType,
        redeemed_at: new Date().toISOString(),
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error tracking birthday redemption:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if customer has birthday today
 */
export async function isCustomerBirthday(
  customerId: string
): Promise<{ success: boolean; isBirthday?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('dob')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    if (!data.dob) {
      return { success: true, isBirthday: false };
    }

    const dob = new Date(data.dob);
    const today = new Date();
    
    const isBirthday = 
      dob.getMonth() === today.getMonth() &&
      dob.getDate() === today.getDate();

    return { success: true, isBirthday };
  } catch (error: any) {
    console.error('Error checking birthday:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update customer DOB
 */
export async function updateCustomerDOB(
  customerId: string,
  dob: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ dob })
      .eq('id', customerId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating DOB:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get birthday statistics for a cafe
 */
export async function getBirthdayStats(
  cafeId: string
): Promise<{
  success: boolean;
  stats?: {
    total_customers_with_dob: number;
    birthdays_this_month: number;
    birthdays_this_week: number;
    redemptions_this_year: number;
  };
  error?: string;
}> {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get total customers with DOB
    const { data: customersWithDOB, error: dobError } = await supabase
      .from('users')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('role', 'customer')
      .not('dob', 'is', null);

    if (dobError) throw dobError;

    // Get birthdays this month
    const { data: birthdaysThisMonth, error: monthError } = await supabase
      .from('users')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('role', 'customer')
      .gte('dob', startOfMonth.toISOString().split('T')[1])
      .lte('dob', endOfMonth.toISOString().split('T')[1]);

    if (monthError) throw monthError;

    // Get birthdays this week
    const { data: birthdaysThisWeek, error: weekError } = await supabase
      .from('users')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('role', 'customer')
      .gte('dob', today.toISOString().split('T')[1])
      .lte('dob', nextWeek.toISOString().split('T')[1]);

    if (weekError) throw weekError;

    // Get redemptions this year
    const { data: redemptions, error: redemptionError } = await supabase
      .from('activity_log')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('action', 'birthday_redemption')
      .gte('created_at', startOfYear.toISOString());

    if (redemptionError) throw redemptionError;

    return {
      success: true,
      stats: {
        total_customers_with_dob: customersWithDOB?.length || 0,
        birthdays_this_month: birthdaysThisMonth?.length || 0,
        birthdays_this_week: birthdaysThisWeek?.length || 0,
        redemptions_this_year: redemptions?.length || 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching birthday stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format date for display
 */
export function formatBirthday(dob: string): string {
  const date = new Date(dob);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Get days until birthday
 */
export function getDaysUntilBirthday(dob: string): number {
  const today = new Date();
  const birthday = new Date(dob);
  birthday.setFullYear(today.getFullYear());
  
  if (birthday < today) {
    birthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = birthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
