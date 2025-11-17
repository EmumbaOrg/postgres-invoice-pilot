import apiService from './api.service';
import { API_BASE_URL } from '../lib/axios';

/**
 * Documents Service
 * Handles all document-related API calls
 */
export const documentsService = {
  /**
   * Get list of documents
   */
  getDocuments: async () => {
    return apiService.get('documents/');
  },

  /**
   * Get documents sorted by creation date
   */
  getRecentDocuments: async (sortBy = 'created') => {
    return apiService.get(`documents/?sort_by=${sortBy}`);
  },

  /**
   * Get document URL
   */
  getDocumentUrl: (blobName) => {
    return `${API_BASE_URL}documents/${blobName}`;
  },

  /**
   * Upload document
   */
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.postFormData('documents/', formData);
  },

  /**
   * Delete document
   */
  deleteDocument: async (blobName) => {
    return apiService.delete(`documents/${blobName}`);
  },
};

