import apiService from './api.service';

/**
 * Get list of invoices with optional filters
 */
export const getInvoices = async ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return apiService.get(
    `invoices/?vendor_id=${vendorId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
  );
};

/**
 * Get single invoice by ID
 */
export const getInvoice = async (id) => {
  return apiService.get(`invoices/${id}`);
};

/**
 * Analyze invoice from file upload
 */
export const analyzeInvoice = async ({ file, data }) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Append additional data fields
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  return apiService.postFormData('invoices/', formData);
};

/**
 * Validate invoice
 */
export const validateInvoice = async (id) => {
  return apiService.post(`validation/invoice/${id}`);
};

/**
 * Update invoice
 */
export const updateInvoice = async ({ id, data }) => {
  return apiService.put(`invoices/${id}`, data);
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (id) => {
  return apiService.delete(`invoices/${id}`);
};

/**
 * Get validation results for invoice
 */
export const getValidationResults = async (id) => {
  return apiService.get(`validation/invoice/${id}`);
};

