import apiService from './api.service';

/**
 * SOWs (Statement of Work) Service
 * Handles all SOW-related API calls
 */
export const sowsService = {
  /**
   * Get list of SOWs with optional filters
   */
  getSows: async ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
    return apiService.get(
      `sows/?vendor_id=${vendorId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
    );
  },

  /**
   * Get single SOW by ID
   */
  getSow: async (id) => {
    return apiService.get(`sows/${id}`);
  },

  /**
   * Analyze SOW from file upload
   */
  analyzeSow: async ({ file, data }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append additional data fields
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return apiService.postFormData('sows/', formData);
  },

  /**
   * Validate SOW
   */
  validateSow: async (id) => {
    return apiService.post(`validation/sow/${id}`);
  },

  /**
   * Update SOW
   */
  updateSow: async ({ id, data }) => {
    return apiService.put(`sows/${id}`, data);
  },

  /**
   * Delete SOW
   */
  deleteSow: async (id) => {
    return apiService.delete(`sows/${id}`);
  },

  /**
   * Get SOW chunks
   */
  getSowChunks: async (id) => {
    return apiService.get(`sows/${id}/chunks`);
  },

  /**
   * Get validation results for SOW
   */
  getValidationResults: async (id) => {
    return apiService.get(`validation/sow/${id}`);
  },
};

