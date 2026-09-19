import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized React Query client configuration for production
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      // Menu data: 5 minutes (changes infrequently)
      staleTime: 5 * 60 * 1000,
      
      // Garbage collection time: how long inactive data stays in cache
      // Menu data: 30 minutes (keep in memory for quick access)
      gcTime: 30 * 60 * 1000,
      
      // Don't refetch on window focus (reduces unnecessary requests)
      refetchOnWindowFocus: false,
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Retry delay: exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on reconnect (reduces unnecessary requests)
      refetchOnReconnect: false,
    },
  },
});

/**
 * Prefetch menu data for a cafe
 */
export async function prefetchMenuData(cafeId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['menuItems', cafeId],
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch order data
 */
export async function prefetchOrderData(orderId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['order', orderId],
    staleTime: 30 * 1000, // 30 seconds for orders (more dynamic)
  });
}

/**
 * Prefetch customer data
 */
export async function prefetchCustomerData(customerId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['customer', customerId],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Invalidate cache for specific queries
 */
export function invalidateMenuCache(cafeId: string): void {
  queryClient.invalidateQueries({ queryKey: ['menuItems', cafeId] });
}

export function invalidateOrderCache(orderId?: string): void {
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }
}

export function invalidateCustomerCache(customerId?: string): void {
  if (customerId) {
    queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }
}

/**
 * Set query data directly (for optimistic updates)
 */
export function setQueryData<T>(queryKey: string[], data: T): void {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Get query data from cache
 */
export function getQueryData<T>(queryKey: string[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  queryClient.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  queryCount: number;
  mutationCount: number;
} {
  const cache = queryClient.getQueryCache();
  const mutations = queryClient.getMutationCache();
  
  return {
    queryCount: cache.getAll().length,
    mutationCount: mutations.getAll().length,
  };
}
