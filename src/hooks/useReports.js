import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

export function useReportOverview(params = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportService.getOverview(params),
    staleTime: 120_000,
  });
}

export function useProjectStatusReport(params = {}) {
  return useQuery({
    queryKey: ['report-status', params],
    queryFn: () => reportService.getProjectStatus(params),
    staleTime: 120_000,
  });
}

export function usePriorityReport(params = {}) {
  return useQuery({
    queryKey: ['report-priority', params],
    queryFn: () => reportService.getPriority(params),
    staleTime: 120_000,
  });
}

export function useTaskStatusReport(params = {}) {
  return useQuery({
    queryKey: ['report-task-status', params],
    queryFn: () => reportService.getTaskStatus(params),
    staleTime: 120_000,
  });
}

export function useRevenueTrend(params = {}) {
  return useQuery({
    queryKey: ['report-revenue-trend', params],
    queryFn: () => reportService.getRevenueTrend(params),
    staleTime: 120_000,
  });
}

export function useStageCompletion(params = {}) {
  return useQuery({
    queryKey: ['report-stage-completion', params],
    queryFn: () => reportService.getStageCompletion(params),
    staleTime: 120_000,
  });
}

export function useEngineerUtilization(params = {}) {
  return useQuery({
    queryKey: ['report-engineer', params],
    queryFn: () => reportService.getEngineerUtilization(params),
    staleTime: 60_000,
  });
}
