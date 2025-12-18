import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSows, getSow, analyzeSow, validateSow, updateSow, deleteSow, getSowChunks, getValidationResults } from '../services/sows.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch SOWs list
 */
export const useSOWs = ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.sows.list({ vendorId, skip, limit, sortBy }),
    queryFn: () => getSows({ vendorId, skip, limit, sortBy }),
    staleTime: 30_000,
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
 * Hook to delete SOW
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
      // Rollback on error
      context?.previousSOWs?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.sows.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
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

