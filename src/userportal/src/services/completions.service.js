import apiService from './api.service';

/**
 * Send chat message
 */
export const sendChatMessage = async ({ sessionId, message }) => {
  return apiService.post('completions/chat', {
    session_id: sessionId,
    message,
  });
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (sessionId) => {
  return apiService.get(`completions/history/${sessionId}`);
};

/**
 * Get all chat sessions
 */
export const getChatSessions = async () => {
  return apiService.get('completions/sessions');
};

/**
 * Delete chat session
 */
export const deleteChatSession = async (sessionId) => {
  return apiService.delete(`completions/sessions/${sessionId}`);
};

