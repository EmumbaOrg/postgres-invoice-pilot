import apiService from './api.service';

/**
 * Statuses Service
 * Handles all status-related API calls
 */
export const statusesService = {
  /**
   * Get app status
   */
  getStatus: async () => {
    return apiService.get('status');
  },

  /**
   * Get list of all statuses
   */
  getStatusList: async () => {
    return apiService.get('statuses/');
  },
};

