import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  getCurrentUser,
  getCurrentSession,
  logout as logoutService,
  onAuthStateChange,
  refreshSession,
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get current session
        const currentSession = await getCurrentSession();
        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }

        // Get current user (in case session exists but user data needed)
        const currentUser = await getCurrentUser();
        if (!mounted) return;

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            setError(null);
          }
          break;

        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          break;

        case 'TOKEN_REFRESHED':
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
          break;

        case 'USER_UPDATED':
          if (newSession) {
            setUser(newSession.user);
          }
          break;
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Auto-refresh session periodically (every 4 minutes)
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          const newSession = await refreshSession();
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        } catch (err) {
          console.error('Auto-refresh error:', err);
        }
      },
      4 * 60 * 1000 // 4 minutes
    );

    return () => clearInterval(refreshInterval);
  }, [session]);

  const logout = async () => {
    try {
      setError(null);
      const result = await logoutService();

      if (!result.success) {
        setError(result.error || 'Failed to logout');
        return;
      }

      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  const refresh = async () => {
    try {
      setError(null);
      const newSession = await refreshSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh session');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
