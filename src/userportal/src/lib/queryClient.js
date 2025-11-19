import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client
 * This centralizes query and mutation default behaviors
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time before data is considered stale (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Time before inactive queries are garbage collected (10 minutes)
      // Increased to handle StrictMode remounting - keeps queries in cache longer
      // This ensures that even if a component unmounts and remounts quickly,
      // the query data stays in cache and doesn't trigger a duplicate request
      gcTime: 10 * 60 * 1000,
      
      // Retry failed queries
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount only if data is stale (prevents duplicate calls in StrictMode)
      // React Query automatically deduplicates identical queries by query key,
      // but 'true' ensures we only refetch when data is actually stale (older than staleTime)
      // This works together with staleTime to prevent unnecessary refetches
      refetchOnMount: true,
      
      // Enable structural sharing (default: true) to ensure stable references
      // This helps React Query detect when data hasn't changed
      structuralSharing: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
      // Retry delay
      retryDelay: 1000,
    },
  },
});

