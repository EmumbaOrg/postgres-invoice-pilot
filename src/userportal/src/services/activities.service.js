import apiService from './api.service';

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit = 3) => {
  return apiService.get(`activity_logs/?limit=${limit}`);
};

