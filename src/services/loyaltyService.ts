import { supabase } from './supabase';

export interface LoyaltyStatus {
  id: string;
  customer_id: string;
  cafe_id: string;
  points: number;
  orders_count: number;
  total_spent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  last_redeemed: string | null;
  created_at: string;
  updated_at: string;
}

export interface RedemptionHistory {
  id: string;
  customer_id: string;
  cafe_id: string;
  order_id: string;
  items: string[];
  redeemed_at: string;
}

/**
 * Get loyalty status for a customer at a specific cafe
 */
export async function getLoyaltyStatus(
  customerId: string,
  cafeId: string
): Promise<{ success: boolean; status?: LoyaltyStatus; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('customer_id', customerId)
      .eq('cafe_id', cafeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return default
        return {
          success: true,
          status: {
            id: '',
            customer_id: customerId,
            cafe_id: cafeId,
            points: 0,
            orders_count: 0,
            total_spent: 0,
            tier: 'bronze',
            last_redeemed: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
      throw error;
    }

    return {
      success: true,
      status: data,
    };
  } catch (error: any) {
    console.error('Error fetching loyalty status:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch loyalty status',
    };
  }
}

/**
 * Add loyalty point after completing an order
 */
export async function addLoyaltyPoint(
  customerId: string,
  cafeId: string,
  orderAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current loyalty status
    const { data: currentStatus, error: fetchError } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('customer_id', customerId)
      .eq('cafe_id', cafeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const newOrdersCount = (currentStatus?.orders_count || 0) + 1;
    const newPoints = (currentStatus?.points || 0) + 10; // 10 points per order
    const newTotalSpent = (currentStatus?.total_spent || 0) + orderAmount;

    // Calculate tier
    let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (newTotalSpent >= 5000 || newOrdersCount >= 50) tier = 'platinum';
    else if (newTotalSpent >= 2000 || newOrdersCount >= 25) tier = 'gold';
    else if (newTotalSpent >= 500 || newOrdersCount >= 10) tier = 'silver';

    if (currentStatus) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          orders_count: newOrdersCount,
          points: newPoints,
          total_spent: newTotalSpent,
          tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStatus.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { error: insertError } = await supabase.from('loyalty_points').insert({
        customer_id: customerId,
        cafe_id: cafeId,
        orders_count: 1,
        points: 10,
        total_spent: orderAmount,
        tier,
      });

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error adding loyalty point:', error);
    return {
      success: false,
      error: error.message || 'Failed to add loyalty point',
    };
  }
}

/**
 * Redeem reward for a customer
 */
export async function redeemReward(
  customerId: string,
  cafeId: string,
  orderId: string,
  selectedItems: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current loyalty status
    const { data: currentStatus, error: fetchError } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('customer_id', customerId)
      .eq('cafe_id', cafeId)
      .single();

    if (fetchError || !currentStatus) {
      throw new Error('Loyalty status not found');
    }

    // Check eligibility
    if (currentStatus.orders_count < 7) {
      throw new Error('Not eligible for reward yet');
    }

    // Check cooldown (6 hours)
    if (currentStatus.last_redeemed) {
      const lastRedeemed = new Date(currentStatus.last_redeemed).getTime();
      const now = Date.now();
      const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours

      if (now - lastRedeemed < cooldownMs) {
        throw new Error('Please wait before redeeming another reward');
      }
    }

    // Record redemption
    const { error: redemptionError } = await supabase.from('loyalty_redemptions').insert({
      customer_id: customerId,
      cafe_id: cafeId,
      order_id: orderId,
      items: selectedItems,
      redeemed_at: new Date().toISOString(),
    });

    if (redemptionError) throw redemptionError;

    // Update loyalty status (reset orders count)
    const { error: updateError } = await supabase
      .from('loyalty_points')
      .update({
        orders_count: 0,
        last_redeemed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentStatus.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Error redeeming reward:', error);
    return {
      success: false,
      error: error.message || 'Failed to redeem reward',
    };
  }
}

/**
 * Get redemption history for a customer at a cafe
 */
export async function getRedemptionHistory(
  customerId: string,
  cafeId: string
): Promise<{ success: boolean; history?: RedemptionHistory[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('loyalty_redemptions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('cafe_id', cafeId)
      .order('redeemed_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      history: data || [],
    };
  } catch (error: any) {
    console.error('Error fetching redemption history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch redemption history',
    };
  }
}

/**
 * Check if customer is eligible for reward
 */
export function isEligibleForReward(ordersCount: number, lastRedeemed: string | null): boolean {
  if (ordersCount < 7) return false;

  if (lastRedeemed) {
    const lastRedeemedTime = new Date(lastRedeemed).getTime();
    const now = Date.now();
    const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours

    if (now - lastRedeemedTime < cooldownMs) {
      return false;
    }
  }

  return true;
}

/**
 * Get orders until next reward
 */
export function getOrdersUntilReward(ordersCount: number): number {
  const remaining = 7 - (ordersCount % 7);
  return remaining === 7 ? 0 : remaining;
}

/**
 * Get cooldown remaining time in minutes
 */
export function getCooldownRemaining(lastRedeemed: string | null): number {
  if (!lastRedeemed) return 0;

  const lastRedeemedTime = new Date(lastRedeemed).getTime();
  const now = Date.now();
  const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours
  const remainingMs = cooldownMs - (now - lastRedeemedTime);

  return Math.max(0, Math.ceil(remainingMs / (60 * 1000))); // minutes
}
