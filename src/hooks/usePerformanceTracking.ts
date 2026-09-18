import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor, reportWebVitals } from '../utils/monitoring';

/**
 * Hook to track page view performance
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Mark page load start
    performanceMonitor.mark('page-load-start');

    // Track page view
    const trackPageView = () => {
      performanceMonitor.mark('page-load-end');
      performanceMonitor.measure('page-load', 'page-load-start', 'page-load-end');
      
      // Report to analytics
      if (import.meta.env.PROD) {
        const metrics = performanceMonitor.getMetrics();
        console.log('[Performance]', {
          page: location.pathname,
          ...metrics,
        });
      }
    };

    // Wait for page to load
    if (document.readyState === 'complete') {
      trackPageView();
    } else {
      window.addEventListener('load', trackPageView);
      return () => window.removeEventListener('load', trackPageView);
    }
  }, [location.pathname]);
}

/**
 * Hook to track component render performance
 */
export function useRenderTracking(componentName: string): void {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const renderStart = performance.now();
      
      return () => {
        const renderTime = performance.now() - renderStart;
        console.log(`[Render] ${componentName}: ${renderTime.toFixed(2)}ms`);
      };
    }
  });
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking(): void {
  useEffect(() => {
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const interaction = {
        type: event.type,
        target: target.tagName,
        id: target.id,
        className: target.className,
        timestamp: Date.now(),
      };

      if (import.meta.env.DEV) {
        console.log('[Interaction]', interaction);
      }

      // Send to analytics in production
      if (import.meta.env.PROD && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/interactions', JSON.stringify(interaction));
      }
    };

    // Track clicks
    document.addEventListener('click', trackInteraction);
    
    // Track form submissions
    document.addEventListener('submit', trackInteraction);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('submit', trackInteraction);
    };
  }, []);
}

/**
 * Hook to track Web Vitals
 */
export function useWebVitals(): void {
  useEffect(() => {
    if (import.meta.env.PROD) {
      // Import web-vitals dynamically to reduce bundle size
      import('web-vitals').then(({ onCLS, onLCP, onFCP, onTTFB, onINP }) => {
        onCLS(reportWebVitals);
        onINP(reportWebVitals);
        onLCP(reportWebVitals);
        onFCP(reportWebVitals);
        onTTFB(reportWebVitals);
      });
    }
  }, []);
}

/**
 * Hook to track API request performance
 */
export function useApiTracking(): void {
  useEffect(() => {
    if (import.meta.env.PROD) {
      const originalFetch = window.fetch;
      
      window.fetch = async function(...args) {
        const [url, options] = args;
        const startTime = performance.now();
        
        try {
          const response = await originalFetch.apply(this, args);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Log slow requests
          if (duration > 1000) {
            const requestUrl = typeof url === 'string' ? url : (url as Request).url;
            console.warn('[API] Slow request:', {
              url: requestUrl,
              duration: `${duration.toFixed(2)}ms`,
              method: options?.method || 'GET',
              status: response.status,
            });
          }
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          const requestUrl = typeof url === 'string' ? url : (url as Request).url;
          console.error('[API] Request failed:', {
            url: requestUrl,
            duration: `${duration.toFixed(2)}ms`,
            error,
          });
          
          throw error;
        }
      };
      
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, []);
}

/**
 * Hook to track memory usage
 */
export function useMemoryTracking(): void {
  useEffect(() => {
    if (import.meta.env.PROD && 'memory' in performance) {
      const trackMemory = () => {
        const memory = (performance as any).memory;
        const memoryInfo = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
          jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
          timestamp: Date.now(),
        };
        
        // Log high memory usage
        if (memoryInfo.usedJSHeapSize > 100) {
          console.warn('[Memory] High usage:', memoryInfo);
        }
        
        // Send to analytics
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/memory', JSON.stringify(memoryInfo));
        }
      };
      
      // Track memory every 30 seconds
      const interval = setInterval(trackMemory, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);
}

/**
 * Hook to track errors
 */
export function useErrorTracking(): void {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      };
      
      console.error('[Error]', errorInfo);
      
      // Send to error tracking service
      if (import.meta.env.PROD && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/errors', JSON.stringify(errorInfo));
      }
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorInfo = {
        message: 'Unhandled Promise Rejection',
        reason: reason?.message || String(reason),
        stack: reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      };
      
      console.error('[Unhandled Rejection]', errorInfo);
      
      // Send to error tracking service
      if (import.meta.env.PROD && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/errors', JSON.stringify(errorInfo));
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

/**
 * Combined performance tracking hook
 */
export function usePerformanceTracking(): void {
  usePageTracking();
  useInteractionTracking();
  useWebVitals();
  useApiTracking();
  useMemoryTracking();
  useErrorTracking();
}
