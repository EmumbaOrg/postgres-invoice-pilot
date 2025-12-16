import apiService from './api.service';

/**
 * Get list of deliverables with optional filters
 */
export const getDeliverables = async ({ milestoneId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return apiService.get(
    `deliverables/?milestone_id=${milestoneId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
  );
};

/**
 * Get single deliverable by ID
 */
export const getDeliverable = async (id) => {
  return apiService.get(`deliverables/${id}`);
};

/**
 * Create new deliverable
 */
export const createDeliverable = async ({ milestoneId, data }) => {
  const formData = new FormData();
  formData.append('milestone_id', milestoneId);
  
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  return apiService.postFormData('deliverables/', formData);
};

/**
 * Update deliverable
 */
export const updateDeliverable = async ({ id, data }) => {
  return apiService.put(`deliverables/${id}`, data);
};

/**
 * Delete deliverable
 */
export const deleteDeliverable = async (id) => {
  return apiService.delete(`deliverables/${id}`);
};

