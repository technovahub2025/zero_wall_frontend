import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchEmployeeDashboard, fetchSuperadminDashboard } from '../api/dashboard';

export function useDashboard(role = 'superadmin', queryOptions = {}) {
  return useQuery({
    queryKey: ['dashboard', role],
    staleTime: queryOptions.staleTime ?? 60_000,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    queryFn: async () => {
      if (role === 'employee') return fetchEmployeeDashboard();
      if (role === 'superadmin') return fetchSuperadminDashboard();
      return fetchDashboard();
    },
    ...queryOptions,
  });
}
