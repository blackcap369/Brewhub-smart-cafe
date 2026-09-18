import { supabase } from './supabase';

export interface Feedback {
  id: string;
  order_id: string;
  customer_id: string;
  cafe_id: string;
  rating: number;
  comment: string | null;
  categories: string[];
  is_anonymous: boolean;
  response: string | null;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  response_rate: number;
  recent_trend: number; // percentage change in last 30 days
}

export interface FeedbackFilters {
  rating?: number;
  date_from?: string;
  date_to?: string;
  has_response?: boolean;
}

/**
 * Submit feedback for an order
 */
export async function submitFeedback(params: {
  orderId: string;
  customerId: string;
  cafeId: string;
  rating: number;
  comment?: string;
  categories?: string[];
  isAnonymous?: boolean;
}): Promise<{ success: boolean; feedback?: Feedback; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        order_id: params.orderId,
        customer_id: params.customerId,
        cafe_id: params.cafeId,
        rating: params.rating,
        comment: params.comment || null,
        categories: params.categories || [],
        is_anonymous: params.isAnonymous || false,
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, feedback: data };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all feedback for a cafe with filters
 */
export async function getFeedback(
  cafeId: string,
  filters?: FeedbackFilters
): Promise<{ success: boolean; feedback?: Feedback[]; error?: string }> {
  try {
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false });

    if (filters?.rating) {
      query = query.eq('rating', filters.rating);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters?.has_response !== undefined) {
      if (filters.has_response) {
        query = query.not('response', 'is', null);
      } else {
        query = query.is('response', null);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, feedback: data };
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get feedback for a specific order
 */
export async function getFeedbackByOrder(
  orderId: string
): Promise<{ success: boolean; feedback?: Feedback; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No feedback found
        return { success: true, feedback: undefined };
      }
      throw error;
    }

    return { success: true, feedback: data };
  } catch (error: any) {
    console.error('Error fetching feedback by order:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate average rating for a cafe
 */
export async function getAverageRating(
  cafeId: string
): Promise<{ success: boolean; average?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating')
      .eq('cafe_id', cafeId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, average: 0 };
    }

    const sum = data.reduce((acc, f) => acc + f.rating, 0);
    const average = sum / data.length;

    return { success: true, average };
  } catch (error: any) {
    console.error('Error calculating average rating:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comprehensive feedback statistics
 */
export async function getFeedbackStats(
  cafeId: string
): Promise<{ success: boolean; stats?: FeedbackStats; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating, response, created_at')
      .eq('cafe_id', cafeId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: true,
        stats: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          response_rate: 0,
          recent_trend: 0,
        },
      };
    }

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((f) => {
      distribution[f.rating as keyof typeof distribution]++;
    });

    // Calculate average
    const sum = data.reduce((acc, f) => acc + f.rating, 0);
    const average = sum / data.length;

    // Calculate response rate
    const responded = data.filter((f) => f.response !== null).length;
    const responseRate = (responded / data.length) * 100;

    // Calculate recent trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentFeedback = data.filter(
      (f) => new Date(f.created_at) >= thirtyDaysAgo
    );
    const previousFeedback = data.filter(
      (f) => {
        const date = new Date(f.created_at);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }
    );

    const recentAvg = recentFeedback.length > 0
      ? recentFeedback.reduce((acc, f) => acc + f.rating, 0) / recentFeedback.length
      : 0;
    const previousAvg = previousFeedback.length > 0
      ? previousFeedback.reduce((acc, f) => acc + f.rating, 0) / previousFeedback.length
      : 0;

    const trend = previousAvg > 0
      ? ((recentAvg - previousAvg) / previousAvg) * 100
      : 0;

    return {
      success: true,
      stats: {
        average_rating: average,
        total_reviews: data.length,
        rating_distribution: distribution,
        response_rate: responseRate,
        recent_trend: trend,
      },
    };
  } catch (error: any) {
    console.error('Error fetching feedback stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Respond to feedback
 */
export async function respondToFeedback(
  feedbackId: string,
  response: string,
  respondedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('feedback')
      .update({
        response,
        responded_at: new Date().toISOString(),
        responded_by: respondedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error responding to feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent feedback for display (4+ stars)
 */
export async function getRecentPositiveFeedback(
  cafeId: string,
  limit: number = 10
): Promise<{ success: boolean; feedback?: Feedback[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('cafe_id', cafeId)
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, feedback: data };
  } catch (error: any) {
    console.error('Error fetching recent positive feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get feedback categories breakdown
 */
export async function getCategoryBreakdown(
  cafeId: string
): Promise<{
  success: boolean;
  categories?: Record<string, { count: number; average: number }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating, categories')
      .eq('cafe_id', cafeId);

    if (error) throw error;

    const categoryStats: Record<string, { count: number; total: number }> = {};

    data?.forEach((feedback) => {
      feedback.categories?.forEach((category: string) => {
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, total: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].total += feedback.rating;
      });
    });

    const categories = Object.fromEntries(
      Object.entries(categoryStats).map(([key, value]) => [
        key,
        {
          count: value.count,
          average: value.total / value.count,
        },
      ])
    );

    return { success: true, categories };
  } catch (error: any) {
    console.error('Error fetching category breakdown:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export feedback data as CSV
 */
export function exportFeedbackToCSV(feedback: Feedback[]): string {
  const headers = [
    'ID',
    'Order ID',
    'Customer ID',
    'Rating',
    'Comment',
    'Categories',
    'Anonymous',
    'Response',
    'Responded At',
    'Created At',
  ];

  const rows = feedback.map((f) => [
    f.id,
    f.order_id,
    f.customer_id,
    f.rating.toString(),
    `"${(f.comment || '').replace(/"/g, '""')}"`,
    `"${(f.categories || []).join(', ')}"`,
    f.is_anonymous ? 'Yes' : 'No',
    `"${(f.response || '').replace(/"/g, '""')}"`,
    f.responded_at || '',
    f.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Get emoji for rating
 */
export function getRatingEmoji(rating: number): string {
  const emojis: Record<number, string> = {
    1: '😞',
    2: '😐',
    3: '😊',
    4: '😍',
    5: '🤩',
  };
  return emojis[rating] || '😊';
}

/**
 * Get rating label
 */
export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };
  return labels[rating] || 'Good';
}

/**
 * Get category label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    food_quality: 'Food Quality',
    service: 'Service',
    ambience: 'Ambience',
    value: 'Value',
  };
  return labels[category] || category;
}
