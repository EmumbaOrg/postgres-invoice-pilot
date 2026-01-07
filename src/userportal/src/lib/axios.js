import axios from 'axios';

/**
 * Base API URL from environment variables
 * The env variable must always contain a trailing slash
 */
const API_BASE_URL = import.meta.env.VITE_SERVICE_API_ENDPOINT_URL || 'http://localhost:8000/';

/**
 * Axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
});

/**
 * Request interceptor
 * Add authentication tokens or modify requests before they are sent
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handle responses and errors globally
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const respData = error.response.data || {};
      let errorMessage = respData?.message || 'An error occurred';

      // If 'detail' is present and is an array (Pydantic style validation), format it
      const detail = respData?.detail;
      if (Array.isArray(detail)) {
        // Build a readable message and attach details
        const parts = detail.map((d) => {
          try {
            const loc = Array.isArray(d.loc) ? d.loc.join('.') : d.loc;
            const msg = d.msg || JSON.stringify(d);
            return loc ? `${loc}: ${msg}` : msg;
          } catch (ex) {
            return d.msg || JSON.stringify(d);
          }
        });
        errorMessage = parts.join('; ');
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (respData?.message) {
        errorMessage = respData.message;
      }
      
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          console.error('Unauthorized access');
          break;
        case 403:
          // Handle forbidden
          console.error('Forbidden access');
          break;
        case 404:
          // Handle not found
          console.error('Resource not found');
          break;
        case 409:
          // Handle conflict (e.g., duplicate entry)
          break;
        case 500:
          // Handle server error
          console.error('Server error');
          break;
        default:
          break;
      }
      
      const newErr = new Error(errorMessage);
      // Attach original detail array if present so callers can inspect field-level errors
      if (detail) newErr.details = detail;
      return Promise.reject(newErr);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
    }
  }
);

export default axiosInstance;
export { API_BASE_URL };

