import apiService from './api.service';

/**
 * Milestones Service
 * Handles all milestone-related API calls
 */
export const milestonesService = {
  /**
   * Get list of milestones with optional filters
   */
  getMilestones: async ({ sowId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
    return apiService.get(
      `milestones/?sow_id=${sowId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
    );
  },

  /**
   * Get single milestone by ID
   */
  getMilestone: async (id) => {
    return apiService.get(`milestones/${id}`);
  },

  /**
   * Create new milestone
   */
  createMilestone: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return apiService.postFormData('milestones/', formData);
  },

  /**
   * Update milestone
   */
  updateMilestone: async ({ id, data }) => {
    return apiService.put(`milestones/${id}`, data);
  },

  /**
   * Delete milestone
   */
  deleteMilestone: async (id) => {
    return apiService.delete(`milestones/${id}`);
  },
};

