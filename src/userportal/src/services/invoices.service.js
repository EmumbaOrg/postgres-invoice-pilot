import apiService from './api.service';

/**
 * Invoices Service
 * Handles all invoice-related API calls
 */
export const invoicesService = {
  /**
   * Get list of invoices with optional filters
   */
  getInvoices: async ({ vendorId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
    return apiService.get(
      `invoices/?vendor_id=${vendorId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
    );
  },

  /**
   * Get single invoice by ID
   */
  getInvoice: async (id) => {
    return apiService.get(`invoices/${id}`);
  },

  /**
   * Analyze invoice from file upload
   */
  analyzeInvoice: async ({ file, data }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append additional data fields
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return apiService.postFormData('invoices/', formData);
  },

  /**
   * Validate invoice
   */
  validateInvoice: async (id) => {
    return apiService.post(`validation/invoice/${id}`);
  },

  /**
   * Update invoice
   */
  updateInvoice: async ({ id, data }) => {
    return apiService.put(`invoices/${id}`, data);
  },

  /**
   * Delete invoice
   */
  deleteInvoice: async (id) => {
    return apiService.delete(`invoices/${id}`);
  },

  /**
   * Get validation results for invoice
   */
  getValidationResults: async (id) => {
    return apiService.get(`validation/invoice/${id}`);
  },
};

