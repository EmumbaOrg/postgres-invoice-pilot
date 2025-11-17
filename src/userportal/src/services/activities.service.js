import apiService from './api.service';

/**
 * Activities Service
 * Handles all activity log-related API calls
 */
export const activitiesService = {
  /**
   * Get recent activities
   */
  getRecentActivities: async (limit = 3) => {
    return apiService.get(`activity_logs/?limit=${limit}`);
  },
};

