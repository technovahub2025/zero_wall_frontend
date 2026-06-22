import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

export function useReportsBundle(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['reports', 'bundle', params],
    queryFn: () => reportService.getBundle(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useReportOverview(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportService.getOverview(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useProjectStatusReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-status', params],
    queryFn: () => reportService.getProjectStatus(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function usePriorityReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-priority', params],
    queryFn: () => reportService.getPriority(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useTaskStatusReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-task-status', params],
    queryFn: () => reportService.getTaskStatus(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useTaskProgressReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-task-progress', params],
    queryFn: () => reportService.getTaskProgress(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useRevenueTrend(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-revenue-trend', params],
    queryFn: () => reportService.getRevenueTrend(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useStageCompletion(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-stage-completion', params],
    queryFn: () => reportService.getStageCompletion(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useEngineerUtilization(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-engineer', params],
    queryFn: () => reportService.getEngineerUtilization(params),
    staleTime: 60_000,
    ...queryOptions,
  });
}

export function useClientContributionReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-client-contribution', params],
    queryFn: () => reportService.getClientContribution(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}

export function useTimesheetAnalyticsReport(params = {}, queryOptions = {}) {
  return useQuery({
    queryKey: ['report-timesheet-analytics', params],
    queryFn: () => reportService.getTimesheetAnalytics(params),
    staleTime: 120_000,
    ...queryOptions,
  });
}
