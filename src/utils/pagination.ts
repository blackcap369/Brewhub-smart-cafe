/**
 * Pagination utilities for large datasets
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): Omit<PaginatedResponse<any>, 'data'> {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Paginate an array in memory
 */
export function paginateArray<T>(
  data: T[],
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    ...calculatePagination(total, page, pageSize),
  };
}

/**
 * Cursor-based pagination for infinite scroll
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Generate cursor from item ID and timestamp
 */
export function generateCursor(id: string, timestamp: string): string {
  return btoa(`${timestamp}:${id}`);
}

/**
 * Parse cursor to extract ID and timestamp
 */
export function parseCursor(cursor: string): { id: string; timestamp: string } {
  const decoded = atob(cursor);
  const [timestamp, id] = decoded.split(':');
  return { id, timestamp };
}

/**
 * Apply cursor-based pagination to an array
 */
export function paginateWithCursor<T extends { id: string; created_at: string }>(
  data: T[],
  cursor?: string,
  limit: number = 20
): CursorPaginatedResponse<T> {
  let startIndex = 0;
  
  if (cursor) {
    const { id } = parseCursor(cursor);
    startIndex = data.findIndex(item => item.id === id) + 1;
  }
  
  const paginatedData = data.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < data.length;
  const nextCursor = hasMore && paginatedData.length > 0
    ? generateCursor(
        paginatedData[paginatedData.length - 1].id,
        paginatedData[paginatedData.length - 1].created_at
      )
    : undefined;
  
  return {
    data: paginatedData,
    nextCursor,
    hasMore,
  };
}

/**
 * Infinite scroll hook helper
 */
export function useInfiniteScrollConfig<T>(
  fetchFn: (cursor?: string) => Promise<CursorPaginatedResponse<T>>,
  options: {
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  const { limit = 20, enabled = true } = options;
  
  return {
    queryKey: ['infinite-scroll', limit],
    queryFn: ({ pageParam }: { pageParam?: string }) => fetchFn(pageParam),
    getNextPageParam: (lastPage: CursorPaginatedResponse<T>) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled,
  };
}

/**
 * Offset-based pagination for Supabase queries
 */
export function getSupabasePagination(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return { from, to };
}

/**
 * Paginated query builder for Supabase
 */
export async function paginatedQuery<T>(
  query: any,
  page: number,
  pageSize: number,
  countQuery?: any
): Promise<PaginatedResponse<T>> {
  const { from, to } = getSupabasePagination(page, pageSize);
  
  // Execute main query with pagination
  const { data, error } = await query.range(from, to);
  
  if (error) throw error;
  
  // Get total count
  let total = 0;
  if (countQuery) {
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;
    total = count || 0;
  } else {
    // If no count query provided, use data length as approximation
    total = data?.length || 0;
  }
  
  return {
    data: data || [],
    ...calculatePagination(total, page, pageSize),
  };
}

/**
 * Batch operations for better performance
 */
export async function batchOperations<T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  batchSize: number = 10
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Debounced pagination for search/filter
 */
export function useDebouncedPagination(
  callback: (page: number) => void,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (page: number) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(page), delay);
  };
}
