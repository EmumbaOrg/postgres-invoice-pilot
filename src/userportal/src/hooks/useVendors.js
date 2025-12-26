import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendors, getVendor, createVendor, updateVendor, deleteVendor } from '../services/vendors.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch vendors list
 */
export const useVendors = ({ skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.vendors.list({ skip, limit, sortBy }),
    queryFn: () => getVendors({ skip, limit, sortBy }),
    staleTime: 30_000,
  });
};

/**
 * Hook to fetch all vendors (no pagination)
 */
export const useAllVendors = () => {
  return useQuery({
    queryKey: queryKeys.vendors.list({ skip: 0, limit: -1, sortBy: '' }),
    queryFn: () => getVendors({ skip: 0, limit: -1, sortBy: '' }),
  });
};

/**
 * Hook to fetch single vendor
 */
export const useVendor = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => getVendor(id),
    enabled: !!id && (options.enabled !== false),
    ...options,
  });
};

/**
 * Hook to create vendor
 */
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: (newVendor) => {
      // Invalidate vendors list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
      
      // Optimistically add the new vendor to cache
      queryClient.setQueryData(queryKeys.vendors.detail(newVendor.id), newVendor);
    },
  });
};

/**
 * Hook to update vendor
 */
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendor,
    onSuccess: (updatedVendor, variables) => {
      // Invalidate vendors list
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
      
      // Update the specific vendor in cache
      queryClient.setQueryData(
        queryKeys.vendors.detail(variables.id),
        updatedVendor
      );
    },
  });
};

/**
 * Hook to delete vendor
 */
export const useDeleteVendor = (options = {}) => {
  const queryClient = useQueryClient();
  const { fromViewPage = false } = options;

  return useMutation({
    mutationFn: deleteVendor,
    onMutate: async (vendorId) => {
      // Always cancel queries and remove detail to prevent 404
      await queryClient.cancelQueries({ queryKey: ['vendors'] });
      queryClient.removeQueries({ queryKey: queryKeys.vendors.detail(vendorId) });

      if (!fromViewPage) {
        // Only do optimistic updates for list page deletions
        const previousVendorData = queryClient.getQueriesData({
          queryKey: ['vendors'],
        });

        // Update all vendor list caches
        queryClient.setQueriesData({ queryKey: ['vendors', 'list'] }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((vendor) => vendor.id !== vendorId),
            total: Math.max(0, old.total - 1),
          };
        });

        return { previousVendorData };
      }

      return {};
    },
    onError: (err, vendorId, context) => {
      if (context?.previousVendorData) {
        context.previousVendorData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSuccess: (data, vendorId) => {
      queryClient.removeQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
      
      if (fromViewPage) {
        // For view page deletions, clear all vendor list caches and force refetch
        queryClient.removeQueries({ queryKey: ['vendors', 'list'] });
        queryClient.refetchQueries({ queryKey: ['vendors'] });
      }
    },
    onSettled: (data, error, vendorId) => {
      // Always invalidate to ensure eventual consistency
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

