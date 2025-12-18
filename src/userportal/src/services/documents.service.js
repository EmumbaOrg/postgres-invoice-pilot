import apiService from './api.service';
import { API_BASE_URL } from '../lib/axios';

/**
 * Get list of documents
 */
export const getDocuments = async () => {
  return apiService.get('documents/');
};

/**
 * Get documents sorted by creation date
 */
export const getRecentDocuments = async (sortBy = 'created') => {
  return apiService.get(`documents/?sort_by=${sortBy}`);
};

/**
 * Get document URL
 */
export const getDocumentUrl = (blobName) => {
  return `${API_BASE_URL}documents/${blobName}`;
};

/**
 * Upload document
 */
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiService.postFormData('documents/', formData);
};

/**
 * Delete document
 */
export const deleteDocument = async (blobName) => {
  return apiService.delete(`documents/${blobName}`);
};

