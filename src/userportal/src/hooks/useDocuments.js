import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, getRecentDocuments, getDocumentUrl, uploadDocument, deleteDocument } from '../services/documents.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch documents list
 */
export const useDocuments = () => {
  return useQuery({
    queryKey: queryKeys.documents.lists(),
    queryFn: getDocuments,
    staleTime: 30_000,
  });
};

/**
 * Hook to fetch recent documents
 */
export const useRecentDocuments = (sortBy = 'created') => {
  return useQuery({
    queryKey: queryKeys.documents.recent(sortBy),
    queryFn: () => getRecentDocuments(sortBy),
  });
};

/**
 * Hook to upload document
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      // Invalidate documents list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      // Invalidate activities as a new activity was created
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/**
 * Hook to delete document
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onMutate: async (blobName) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.documents.all });

      // Snapshot the previous values
      const previousDocuments = queryClient.getQueriesData({
        queryKey: queryKeys.documents.all,
      });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.documents.all }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((doc) => doc.blob_name !== blobName);
      });

      return { previousDocuments };
    },
    onError: (err, blobName, context) => {
      // Rollback on error
      context?.previousDocuments?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/**
 * Get document URL (not a hook, just a utility function)
 */
export { getDocumentUrl };

