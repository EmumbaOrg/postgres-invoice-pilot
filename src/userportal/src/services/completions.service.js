import apiService from './api.service';

/**
 * Completions Service
 * Handles all chat completion and session-related API calls
 */
export const completionsService = {
  /**
   * Send chat message
   */
  sendChatMessage: async ({ sessionId, message }) => {
    return apiService.post('completions/chat', {
      session_id: sessionId,
      message,
    });
  },

  /**
   * Get chat history for a session
   */
  getChatHistory: async (sessionId) => {
    return apiService.get(`completions/history/${sessionId}`);
  },

  /**
   * Get all chat sessions
   */
  getChatSessions: async () => {
    return apiService.get('completions/sessions');
  },

  /**
   * Delete chat session
   */
  deleteChatSession: async (sessionId) => {
    return apiService.delete(`completions/sessions/${sessionId}`);
  },
};

