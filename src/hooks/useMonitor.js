import { useQuery } from '@tanstack/react-query';
import { monitorService } from '../services/monitorService';
import { useAuthStore } from '../store/authStore';

export function useMonitor(params = {}, queryOptions = {}) {
  const role = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: ['monitor', params],
    enabled: Boolean(role && ['superadmin', 'admin'].includes(role)) && (queryOptions.enabled ?? true),
    queryFn: () => monitorService.overview(params),
    ...queryOptions,
  });
}
