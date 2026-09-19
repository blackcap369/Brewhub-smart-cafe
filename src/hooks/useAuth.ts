import { useCallback, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { sendOTP, verifyOTP } from '../services/authService';

interface UseAuthReturn {
  user: ReturnType<typeof useAuthContext>['user'];
  session: ReturnType<typeof useAuthContext>['session'];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  sendOTP: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const { user, session, loading, error: contextError, isAuthenticated, logout, refresh } =
    useAuthContext();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendOTPHandler = useCallback(async (phone: string) => {
    setLocalError(null);
    setIsSubmitting(true);

    try {
      const result = await sendOTP(phone);

      if (!result.success) {
        setLocalError(result.error || 'Failed to send OTP');
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setLocalError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const login = useCallback(async (phone: string, otp: string) => {
    setLocalError(null);
    setIsSubmitting(true);

    try {
      const result = await verifyOTP(phone, otp);

      if (!result.success) {
        setLocalError(result.error || 'Verification failed');
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setLocalError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    user,
    session,
    loading: loading || isSubmitting,
    error: localError || contextError,
    isAuthenticated,
    login,
    sendOTP: sendOTPHandler,
    logout,
    refresh,
    clearError,
  };
}

export default useAuth;
