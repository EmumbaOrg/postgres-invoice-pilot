import apiService from './api.service';

/**
 * Vendors Service
 * Handles all vendor-related API calls
 */
export const vendorsService = {
  /**
   * Get list of vendors with pagination and sorting
   */
  getVendors: async ({ skip = 0, limit = 10, sortBy = '' } = {}) => {
    return apiService.get(`vendors/?skip=${skip}&limit=${limit}&sortby=${sortBy}`);
  },

  /**
   * Get single vendor by ID
   */
  getVendor: async (id) => {
    return apiService.get(`vendors/${id}`);
  },

  /**
   * Create new vendor
   */
  createVendor: async (data) => {
    return apiService.post('vendors/', data);
  },

  /**
   * Update vendor
   */
  updateVendor: async ({ id, data }) => {
    return apiService.put(`vendors/${id}`, data);
  },

  /**
   * Delete vendor
   */
  deleteVendor: async (id) => {
    return apiService.delete(`vendors/${id}`);
  },
};

