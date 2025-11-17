import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesService } from '../services/milestones.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch milestones list
 */
export const useMilestones = ({ sowId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.milestones.list({ sowId, skip, limit, sortBy }),
    queryFn: () => milestonesService.getMilestones({ sowId, skip, limit, sortBy }),
  });
};

/**
 * Hook to fetch single milestone
 */
export const useMilestone = (id) => {
  return useQuery({
    queryKey: queryKeys.milestones.detail(id),
    queryFn: () => milestonesService.getMilestone(id),
    enabled: !!id,
  });
};

/**
 * Hook to create milestone
 */
export const useCreateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: milestonesService.createMilestone,
    onSuccess: (newMilestone) => {
      // Invalidate milestones list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.lists() });
      
      // Add the new milestone to cache
      queryClient.setQueryData(
        queryKeys.milestones.detail(newMilestone.id),
        newMilestone
      );
    },
  });
};

/**
 * Hook to update milestone
 */
export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: milestonesService.updateMilestone,
    onSuccess: (updatedMilestone, variables) => {
      // Invalidate milestones list
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.lists() });
      
      // Update the specific milestone in cache
      queryClient.setQueryData(
        queryKeys.milestones.detail(variables.id),
        updatedMilestone
      );
    },
  });
};

/**
 * Hook to delete milestone
 */
export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: milestonesService.deleteMilestone,
    onMutate: async (milestoneId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.milestones.lists() });

      // Snapshot the previous value
      const previousMilestones = queryClient.getQueriesData({
        queryKey: queryKeys.milestones.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.milestones.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((milestone) => milestone.id !== milestoneId),
          total: old.total - 1,
        };
      });

      return { previousMilestones };
    },
    onError: (err, milestoneId, context) => {
      // Rollback on error
      context?.previousMilestones?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.lists() });
    },
  });
};

