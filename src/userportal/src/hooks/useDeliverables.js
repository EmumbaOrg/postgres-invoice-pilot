import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDeliverables, getDeliverable, createDeliverable, updateDeliverable, deleteDeliverable } from '../services/deliverables.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch deliverables list
 */
export const useDeliverables = ({ milestoneId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.deliverables.list({ milestoneId, skip, limit, sortBy }),
    queryFn: () => getDeliverables({ milestoneId, skip, limit, sortBy }),
    staleTime: 30_000,
  });
};

/**
 * Hook to fetch single deliverable
 */
export const useDeliverable = (id) => {
  return useQuery({
    queryKey: queryKeys.deliverables.detail(id),
    queryFn: () => getDeliverable(id),
    enabled: !!id,
  });
};

/**
 * Hook to create deliverable
 */
export const useCreateDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeliverable,
    onSuccess: (newDeliverable) => {
      // Invalidate deliverables list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.deliverables.lists() });
      
      // Add the new deliverable to cache
      queryClient.setQueryData(
        queryKeys.deliverables.detail(newDeliverable.id),
        newDeliverable
      );
    },
  });
};

/**
 * Hook to update deliverable
 */
export const useUpdateDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeliverable,
    onSuccess: (updatedDeliverable, variables) => {
      // Invalidate deliverables list
      queryClient.invalidateQueries({ queryKey: queryKeys.deliverables.lists() });
      
      // Update the specific deliverable in cache
      queryClient.setQueryData(
        queryKeys.deliverables.detail(variables.id),
        updatedDeliverable
      );
    },
  });
};

/**
 * Hook to delete deliverable
 */
export const useDeleteDeliverable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeliverable,
    onMutate: async (deliverableId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.deliverables.lists() });

      // Snapshot the previous value
      const previousDeliverables = queryClient.getQueriesData({
        queryKey: queryKeys.deliverables.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.deliverables.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((deliverable) => deliverable.id !== deliverableId),
          total: old.total - 1,
        };
      });

      return { previousDeliverables };
    },
    onError: (err, deliverableId, context) => {
      // Rollback on error
      context?.previousDeliverables?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.deliverables.lists() });
    },
  });
};

