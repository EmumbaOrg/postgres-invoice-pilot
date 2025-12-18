import apiService from './api.service';

/**
 * Get list of invoice line items with optional filters
 */
export const getInvoiceLineItems = async ({ invoiceId = -1, skip = 0, limit = 10, sortBy = '' } = {}) => {
  return apiService.get(
    `invoice_line_items/?invoice_id=${invoiceId}&skip=${skip}&limit=${limit}&sortby=${sortBy}`
  );
};

/**
 * Get single invoice line item by ID
 */
export const getInvoiceLineItem = async (id) => {
  return apiService.get(`invoice_line_items/${id}`);
};

/**
 * Get milestones for an invoice
 */
export const getMilestonesForInvoice = async (invoiceId) => {
  if (!invoiceId) {
    return [];
  }
  return apiService.get(`invoice_line_items/milestones/${invoiceId}`);
};

/**
 * Create new invoice line item
 */
export const createInvoiceLineItem = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });
  return apiService.postFormData('invoice_line_items/', formData);
};

/**
 * Update invoice line item
 */
export const updateInvoiceLineItem = async ({ id, data }) => {
  return apiService.put(`invoice_line_items/${id}`, data);
};

/**
 * Delete invoice line item
 */
export const deleteInvoiceLineItem = async (id) => {
  return apiService.delete(`invoice_line_items/${id}`);
};

