import apiService from './api.service';

/**
 * Get list of SOWs with optional filters
 */
export const getSows = async ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return apiService.get(
    `sows/?vendor_id=${vendorId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
  );
};

/**
 * Get single SOW by ID
 */
export const getSow = async (id) => {
  return apiService.get(`sows/${id}`);
};

/**
 * Analyze SOW from file upload
 */
export const analyzeSow = async ({ file, metadata }) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Append additional metadata fields
  if (metadata && typeof metadata === 'object') {
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });
  }

  return apiService.postFormData('sows/', formData);
};

/**
 * Validate SOW
 */
export const validateSow = async (id) => {
  return apiService.post(`validation/sow/${id}`);
};

/**
 * Update SOW
 */
export const updateSow = async ({ id, data }) => {
  return apiService.put(`sows/${id}`, data);
};

/**
 * Delete SOW
 */
export const deleteSow = async (id) => {
  return apiService.delete(`sows/${id}`);
};

/**
 * Get SOW chunks
 */
export const getSowChunks = async (id) => {
  return apiService.get(`sows/${id}/chunks`);
};

/**
 * Get validation results for SOW
 */
export const getValidationResults = async (id) => {
  return apiService.get(`validation/sow/${id}`);
};

