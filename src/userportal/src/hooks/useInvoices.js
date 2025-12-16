import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, getInvoice, analyzeInvoice, validateInvoice, updateInvoice, deleteInvoice, getValidationResults } from '../services/invoices.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch invoices list
 */
export const useInvoices = ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return useQuery({
    queryKey: queryKeys.invoices.list({ vendorId, skip, limit, sortBy }),
    queryFn: () => getInvoices({ vendorId, skip, limit, sortBy }),
    staleTime: 30_000,
  });
};

/**
 * Hook to fetch single invoice
 */
export const useInvoice = (id) => {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => getInvoice(id),
    enabled: !!id,
  });
};

/**
 * Hook to analyze invoice (upload and process)
 */
export const useAnalyzeInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeInvoice,
    onSuccess: () => {
      // Invalidate invoices list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      // Invalidate documents list as a new document was uploaded
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      // Invalidate activities as a new activity was created
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/**
 * Hook to validate invoice
 */
export const useValidateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateInvoice,
    onSuccess: (_, invoiceId) => {
      // Invalidate validation results
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.validationResults.invoice(invoiceId) 
      });
      // Invalidate the invoice detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.invoices.detail(invoiceId) 
      });
    },
  });
};

/**
 * Hook to update invoice
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: (updatedInvoice, variables) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      
      // Update the specific invoice in cache
      queryClient.setQueryData(
        queryKeys.invoices.detail(variables.id),
        updatedInvoice
      );
    },
  });
};

/**
 * Hook to delete invoice
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onMutate: async (invoiceId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.lists() });

      // Snapshot the previous value
      const previousInvoices = queryClient.getQueriesData({
        queryKey: queryKeys.invoices.lists(),
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.invoices.lists() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((invoice) => invoice.id !== invoiceId),
          total: old.total - 1,
        };
      });

      return { previousInvoices };
    },
    onError: (err, invoiceId, context) => {
      // Rollback on error
      context?.previousInvoices?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/**
 * Hook to fetch invoice validation results
 */
export const useInvoiceValidationResults = (id) => {
  return useQuery({
    queryKey: queryKeys.validationResults.invoice(id),
    queryFn: () => getValidationResults(id),
    enabled: !!id,
  });
};

