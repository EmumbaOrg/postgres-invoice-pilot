import { useQuery } from '@tanstack/react-query';
import { getRecentActivities } from '../services/activities.service';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch recent activities
 */
export const useRecentActivities = (limit = 3) => {
  return useQuery({
    queryKey: queryKeys.activities.recent(limit),
    queryFn: () => getRecentActivities(limit),
    // Refetch more frequently for activities
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

