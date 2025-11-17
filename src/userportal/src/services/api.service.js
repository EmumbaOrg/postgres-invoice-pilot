import axiosInstance from '../lib/axios';

/**
 * Base API Service
 * Provides common HTTP methods with consistent error handling
 */
class ApiService {
  /**
   * GET request
   */
  async get(url, config = {}) {
    return axiosInstance.get(url, config);
  }

  /**
   * POST request with JSON data
   */
  async post(url, data, config = {}) {
    return axiosInstance.post(url, data, config);
  }

  /**
   * POST request with FormData
   */
  async postFormData(url, formData, config = {}) {
    return axiosInstance.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return axiosInstance.put(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch(url, data, config = {}) {
    return axiosInstance.patch(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return axiosInstance.delete(url, config);
  }
}

export default new ApiService();

