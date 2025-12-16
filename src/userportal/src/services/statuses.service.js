import apiService from './api.service';

/**
 * Get app status
 */
export const getStatus = async () => {
  return apiService.get('status');
};

/**
 * Get list of all statuses
 */
export const getStatusList = async () => {
  return apiService.get('statuses/');
};

