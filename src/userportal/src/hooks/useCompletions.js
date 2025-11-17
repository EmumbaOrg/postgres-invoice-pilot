import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { completionsService } from '../services/completions.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch chat sessions
 */
export const useChatSessions = () => {
  return useQuery({
    queryKey: queryKeys.completions.sessions(),
    queryFn: completionsService.getChatSessions,
  });
};

/**
 * Hook to fetch chat history for a session
 */
export const useChatHistory = (sessionId) => {
  return useQuery({
    queryKey: queryKeys.completions.history(sessionId),
    queryFn: () => completionsService.getChatHistory(sessionId),
    enabled: !!sessionId,
  });
};

/**
 * Hook to send chat message
 */
export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completionsService.sendChatMessage,
    onSuccess: (data, variables) => {
      // Invalidate chat history to refetch with new message
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.completions.history(variables.sessionId) 
      });
      
      // Invalidate sessions list in case a new session was created
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.completions.sessions() 
      });
    },
  });
};

/**
 * Hook to delete chat session
 */
export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completionsService.deleteChatSession,
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.completions.sessions() });

      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData(queryKeys.completions.sessions());

      // Optimistically remove from cache
      queryClient.setQueryData(queryKeys.completions.sessions(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((session) => session.id !== sessionId);
      });

      return { previousSessions };
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(
          queryKeys.completions.sessions(),
          context.previousSessions
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.completions.sessions() });
    },
  });
};

