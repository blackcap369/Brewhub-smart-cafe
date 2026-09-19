import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(): void {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      // Adjust this in production
      tracesSampleRate: 1.0,
      // Environment
      environment: import.meta.env.MODE,
      // Release version
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      // Before send hook to filter sensitive data
      beforeSend(event: any) {
        // Remove sensitive data from events
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        return event;
      },
      // Before breadcrumb hook
      beforeBreadcrumb(breadcrumb: any) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.message?.includes('password')) {
          return null;
        }
        return breadcrumb;
      },
    });
  }
}

/**
 * Capture exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * Capture message to Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, { level });
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
}

/**
 * Set user context in Sentry
 */
export function setUser(userId: string | null, extra?: Record<string, any>): void {
  if (import.meta.env.PROD) {
    if (userId) {
      Sentry.setUser({ id: userId, ...extra });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Set tag in Sentry
 */
export function setTag(key: string, value: string): void {
  if (import.meta.env.PROD) {
    Sentry.setTag(key, value);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
): void {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string): any {
  if (import.meta.env.PROD) {
    // Use Sentry's performance monitoring
    return (Sentry as any).startSpan?.({ name, op }) || null;
  }
  return null;
}

/**
 * Web Vitals monitoring
 */
export function reportWebVitals(metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}): void {
  if (import.meta.env.PROD) {
    // Send to Sentry
    Sentry.addBreadcrumb({
      message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      category: 'web-vitals',
      level: 'info',
    });

    // Send to analytics
    if (navigator.sendBeacon) {
      const data = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      };
      navigator.sendBeacon('/api/analytics', JSON.stringify(data));
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.rating);
    }
  }
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  },

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): PerformanceMeasure | undefined {
    if (typeof performance !== 'undefined') {
      try {
        return performance.measure(name, startMark, endMark);
      } catch (error) {
        console.error('Performance measure error:', error);
      }
    }
    return undefined;
  },

  /**
   * Get performance metrics
   */
  getMetrics(): {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  } {
    if (typeof performance === 'undefined') {
      return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime;
    const ttfb = navigation?.responseStart - navigation?.requestStart;

    return {
      fcp,
      ttfb,
    };
  },

  /**
   * Clear performance marks and measures
   */
  clear(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

/**
 * Error boundary wrapper for Sentry
 */
export { Sentry };
