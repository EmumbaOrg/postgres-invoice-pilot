import apiService from './api.service';

/**
 * Get list of vendors with pagination and sorting
 */
export const getVendors = async ({ skip = 0, limit = 10, sortBy = '' } = {}) => {
  return apiService.get(`vendors/?skip=${skip}&limit=${limit}&sortby=${sortBy}`);
};

/**
 * Get single vendor by ID
 */
export const getVendor = async (id) => {
  return apiService.get(`vendors/${id}`);
};

/**
 * Create new vendor
 */
export const createVendor = async (data) => {
  return apiService.post('vendors/', data);
};

/**
 * Update vendor
 */
export const updateVendor = async ({ id, data }) => {
  return apiService.put(`vendors/${id}`, data);
};

/**
 * Delete vendor
 */
export const deleteVendor = async (id) => {
  return apiService.delete(`vendors/${id}`);
};

