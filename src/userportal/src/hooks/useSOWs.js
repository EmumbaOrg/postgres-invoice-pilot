import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSows, getSow, analyzeSow, validateSow, updateSow, deleteSow, getSowChunks, getValidationResults } from '../services/sows.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch SOWs list with enhanced error handling
 */
export const useSOWs = ({ vendorId = -1, skip = 0, limit = 10, sortBy = '', enabled = true, retry, retryDelay } = {}) => {
  return useQuery({
    queryKey: queryKeys.sows.list({ vendorId, skip, limit, sortBy }),
    queryFn: () => getSows({ vendorId, skip, limit, sortBy }),
    staleTime: 30_000,
    enabled: enabled,
    retry: retry || ((failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for server errors and network issues
      return failureCount < 3;
    }),
    retryDelay: retryDelay || ((attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)),
    onError: (error) => {
      console.error('Error fetching SOWs:', error);
      // You could add analytics/monitoring here
    }
  });
};

/**
 * Hook to fetch single SOW
 */
export const useSOW = (id) => {
  return useQuery({
    queryKey: queryKeys.sows.detail(id),
    queryFn: () => getSow(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch SOW chunks
 */
export const useSOWChunks = (id) => {
  return useQuery({
    queryKey: queryKeys.sows.chunks(id),
    queryFn: () => getSowChunks(id),
    enabled: !!id,
  });
};

/**
 * Hook to analyze SOW (upload and process)
 */
export const useAnalyzeSOW = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeSow,
    onSuccess: () => {
      // Invalidate SOWs list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.sows.lists() });
      // Invalidate documents list as a new document was uploaded
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      // Invalidate activities as a new activity was created
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/**
 * Hook to validate SOW
 */
export const useValidateSOW = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateSow,
    onSuccess: (_, sowId) => {
      // Invalidate validation results
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.validationResults.sow(sowId) 
      });
      // Invalidate the SOW detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.sows.detail(sowId) 
      });
    },
  });
};

/**
 * Hook to update SOW
 */
export const useUpdateSOW = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSow,
    onSuccess: (updatedSOW, variables) => {
      // Invalidate SOWs list
      queryClient.invalidateQueries({ queryKey: queryKeys.sows.lists() });
      
      // Update the specific SOW in cache
      queryClient.setQueryData(
        queryKeys.sows.detail(variables.id),
        updatedSOW
      );
    },
  });
};

/**
 * Hook to delete SOW with enhanced error handling
 */
export const useDeleteSOW = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSow,
    onMutate: async (sowId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sows.lists() });

      // Snapshot the previous value
      const previousSOWs = queryClient.getQueriesData({
        queryKey: queryKeys.sows.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.sows.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((sow) => sow.id !== sowId),
          total: old.total - 1,
        };
      });

      return { previousSOWs };
    },
    onError: (err, sowId, context) => {
      console.error('Delete SOW error:', err);
      
      // Rollback optimistic update on error
      context?.previousSOWs?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      
      // Transform error for better user experience
      const enhancedError = new Error();
      enhancedError.response = err.response;
      enhancedError.code = err.code;
      enhancedError.name = err.name;
      enhancedError.message = getDeleteErrorMessage(err);
      
      throw enhancedError;
    },
    onSuccess: () => {
      // Invalidate and refetch SOW lists
      queryClient.invalidateQueries({ queryKey: queryKeys.sows.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.sows.lists() });
    },
  });
};

// Helper function for delete error messages
const getDeleteErrorMessage = (error) => {
  if (error?.response?.status === 404) {
    return 'SOW not found. It may have already been deleted.';
  } else if (error?.response?.status === 403) {
    return 'You do not have permission to delete this SOW.';
  } else if (error?.response?.status === 409) {
    return 'SOW cannot be deleted because it has associated invoices or other data.';
  } else if (error?.response?.status >= 500) {
    return 'Server error occurred while deleting SOW. Please try again later.';
  } else if (error?.code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your internet connection.';
  }
  
  return error?.response?.data?.detail || error?.message || 'Failed to delete SOW.';
};

/**
 * Hook to fetch SOW validation results
 */
export const useSOWValidationResults = (id) => {
  return useQuery({
    queryKey: queryKeys.validationResults.sow(id),
    queryFn: () => getValidationResults(id),
    enabled: !!id,
  });
};

