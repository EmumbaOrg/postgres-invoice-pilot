import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '../services/vendors.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch vendors list
 */
export const useVendors = ({ skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.vendors.list({ skip, limit, sortBy }),
    queryFn: () => vendorsService.getVendors({ skip, limit, sortBy }),
  });
};

/**
 * Hook to fetch all vendors (no pagination)
 */
export const useAllVendors = () => {
  return useQuery({
    queryKey: queryKeys.vendors.list({ skip: 0, limit: -1, sortBy: '' }),
    queryFn: () => vendorsService.getVendors({ skip: 0, limit: -1, sortBy: '' }),
  });
};

/**
 * Hook to fetch single vendor
 */
export const useVendor = (id) => {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => vendorsService.getVendor(id),
    enabled: !!id,
  });
};

/**
 * Hook to create vendor
 */
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsService.createVendor,
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
    mutationFn: vendorsService.updateVendor,
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
export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsService.deleteVendor,
    onMutate: async (vendorId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vendors.lists() });

      // Snapshot the previous value
      const previousVendors = queryClient.getQueriesData({
        queryKey: queryKeys.vendors.lists(),
      });

      // Optimistically update by removing the vendor from all list queries
      queryClient.setQueriesData({ queryKey: queryKeys.vendors.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((vendor) => vendor.id !== vendorId),
          total: old.total - 1,
        };
      });

      // Return context with the snapshot
      return { previousVendors };
    },
    onError: (err, vendorId, context) => {
      // Rollback on error
      context?.previousVendors?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
    },
  });
};

