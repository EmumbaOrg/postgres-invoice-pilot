import { useQuery } from '@tanstack/react-query';
import { getStatus, getStatusList } from '../services/statuses.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch app status
 */
export const useAppStatus = () => {
  return useQuery({
    queryKey: queryKeys.status.detail(),
    queryFn: getStatus,
    // Refetch status periodically
    refetchInterval: 60000, // Every minute
  });
};

/**
 * Hook to fetch status list
 */
export const useStatusList = () => {
  return useQuery({
    queryKey: queryKeys.statuses.list(),
    queryFn: getStatusList,
    // This data rarely changes, so we can cache it longer
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

