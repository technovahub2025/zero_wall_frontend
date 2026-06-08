import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

export function useReportOverview() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getOverview(),
    staleTime: 120_000,
  });
}

export function useProjectStatusReport() {
  return useQuery({
    queryKey: ['report-status'],
    queryFn: () => reportService.getProjectStatus(),
    staleTime: 120_000,
  });
}

export function usePriorityReport() {
  return useQuery({
    queryKey: ['report-priority'],
    queryFn: () => reportService.getPriority(),
    staleTime: 120_000,
  });
}

export function useTaskStatusReport() {
  return useQuery({
    queryKey: ['report-task-status'],
    queryFn: () => reportService.getTaskStatus(),
    staleTime: 120_000,
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ['report-revenue-trend'],
    queryFn: () => reportService.getRevenueTrend(),
    staleTime: 120_000,
  });
}

export function useStageCompletion() {
  return useQuery({
    queryKey: ['report-stage-completion'],
    queryFn: () => reportService.getStageCompletion(),
    staleTime: 120_000,
  });
}

export function useEngineerUtilization() {
  return useQuery({
    queryKey: ['report-engineer'],
    queryFn: () => reportService.getEngineerUtilization(),
    staleTime: 60_000,
  });
}
