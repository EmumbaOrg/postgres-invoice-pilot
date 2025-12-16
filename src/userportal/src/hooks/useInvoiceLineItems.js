import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoiceLineItems, getInvoiceLineItem, getMilestonesForInvoice, createInvoiceLineItem, updateInvoiceLineItem, deleteInvoiceLineItem } from '../services/invoiceLineItems.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch invoice line items list
 */
export const useInvoiceLineItems = ({ invoiceId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.invoiceLineItems.list({ invoiceId, skip, limit, sortBy }),
    queryFn: () => getInvoiceLineItems({ invoiceId, skip, limit, sortBy }),
    staleTime: 30_000, // 30 seconds
  });
};

/**
 * Hook to fetch single invoice line item
 */
export const useInvoiceLineItem = (id) => {
  return useQuery({
    queryKey: queryKeys.invoiceLineItems.detail(id),
    queryFn: () => getInvoiceLineItem(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch milestones for an invoice
 */
export const useInvoiceMilestones = (invoiceId) => {
  return useQuery({
    queryKey: queryKeys.invoiceLineItems.milestones(invoiceId),
    queryFn: () => getMilestonesForInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};

/**
 * Hook to create invoice line item
 */
export const useCreateInvoiceLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoiceLineItem,
    onSuccess: (newLineItem) => {
      // Invalidate invoice line items list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.invoiceLineItems.lists() });
      
      // Add the new line item to cache
      queryClient.setQueryData(
        queryKeys.invoiceLineItems.detail(newLineItem.id),
        newLineItem
      );
    },
  });
};

/**
 * Hook to update invoice line item
 */
export const useUpdateInvoiceLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoiceLineItem,
    onSuccess: (updatedLineItem, variables) => {
      // Invalidate invoice line items list
      queryClient.invalidateQueries({ queryKey: queryKeys.invoiceLineItems.lists() });
      
      // Update the specific line item in cache
      queryClient.setQueryData(
        queryKeys.invoiceLineItems.detail(variables.id),
        updatedLineItem
      );
    },
  });
};

/**
 * Hook to delete invoice line item
 */
export const useDeleteInvoiceLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoiceLineItem,
    onMutate: async (lineItemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.invoiceLineItems.lists() });

      // Snapshot the previous value
      const previousLineItems = queryClient.getQueriesData({
        queryKey: queryKeys.invoiceLineItems.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.invoiceLineItems.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((item) => item.id !== lineItemId),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousLineItems };
    },
    onError: (err, lineItemId, context) => {
      // Rollback on error
      context?.previousLineItems?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.invoiceLineItems.lists() });
    },
  });
};

