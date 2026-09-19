import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface SendOTPResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

/**
 * Send OTP to phone number via Supabase Auth
 * @param phone - Phone number with country code (e.g., +911234567890)
 */
export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  try {
    // Validate phone format
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return {
        success: false,
        error: 'Invalid phone number format. Please use +91 followed by 10 digits.',
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          phone,
        },
      },
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          error: 'Too many requests. Please wait a few minutes before trying again.',
        };
      }

      if (error.message.includes('invalid phone')) {
        return {
          success: false,
          error: 'Invalid phone number. Please check and try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please try again.',
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (err) {
    console.error('Send OTP error:', err);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Verify OTP and authenticate user
 * @param phone - Phone number with country code
 * @param token - 6-digit OTP token
 */
export async function verifyOTP(
  phone: string,
  token: string
): Promise<VerifyOTPResponse> {
  try {
    // Validate inputs
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
      return {
        success: false,
        error: 'Invalid OTP. Please enter 6 digits.',
      };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return {
          success: false,
          error: 'OTP has expired or is invalid. Please request a new one.',
        };
      }

      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many attempts. Please wait before trying again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Verification failed. Please try again.',
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error('Verify OTP error:', err);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return session;
  } catch (err) {
    console.error('Get current session error:', err);
    return null;
  }
}

/**
 * Sign out and clear session
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Clear any local storage items
    localStorage.removeItem('supabase.auth.token');

    return {
      success: true,
    };
  } catch (err) {
    console.error('Logout error:', err);
    return {
      success: false,
      error: 'Failed to logout. Please try again.',
    };
  }
}

/**
 * Listen to auth state changes
 * @param callback - Function called on auth state change
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Refresh session
 */
export async function refreshSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Refresh session error:', error);
      return null;
    }

    return session;
  } catch (err) {
    console.error('Refresh session error:', err);
    return null;
  }
}
