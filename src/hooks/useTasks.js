import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { normalizeProject, normalizeTask } from '../lib/phase2';
import { kanbanService } from '../services/kanbanService';
import { taskService } from '../services/taskService';
import { timerService } from '../services/timerService';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../store/authStore';

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const rows = await taskService.list(filters);
      return rows.map(normalizeTask);
    },
  });
}

export function useProjectTasks(projectId) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['project-tasks', projectId],
    enabled: Boolean(projectId && user?.id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const rows = await taskService.list({ project: projectId, limit: 50 });
      return rows.map(normalizeTask);
    },
  });
}

export function useMyTasks() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['my-tasks', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const rows = await taskService.mine();
      return rows.map(normalizeTask);
    },
  });
}

export function useMyTasksKanban() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['my-tasks-kanban', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const rows = await taskService.mine({ limit: 50 });
      return rows.map(normalizeTask);
    },
  });
}

export function useTaskCounts(projectId) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['task-counts', projectId],
    enabled: Boolean(projectId && user?.id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => taskService.counts({ project: projectId }),
  });
}

export function useKanbanOverview() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['kanban-overview'],
    enabled: Boolean(user?.id && ['superadmin', 'admin', 'project_manager'].includes(user?.role)),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const payload = await projectService.kanbanOverview();
      return {
        ...payload,
        projects: Array.isArray(payload.projects) ? payload.projects.map(normalizeProject) : [],
      };
    },
  });
}

export function useKanbanColumns(boardType) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['kanban-columns', boardType],
    enabled: Boolean(user?.id && boardType),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => kanbanService.getColumns(boardType),
  });
}

export function useSaveKanbanColumns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardType, columns }) => kanbanService.saveColumns(boardType, columns),
    onSettled: (_data, _error, variables) => {
      if (variables?.boardType) {
        queryClient.invalidateQueries({ queryKey: ['kanban-columns', variables.boardType] });
      }
    },
  });
}

export function useTask(id, queryOptions = {}) {
  return useQuery({
    queryKey: ['task', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = await taskService.get(id);
      return normalizeTask(payload);
    },
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions,
  });
}

export function useTaskTimerLogs(taskId, queryOptions = {}) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['timer-logs', 'task', taskId, user?.id],
    enabled: Boolean(taskId && user?.id),
    queryFn: async () => {
      const payload = await timerService.mine({ task: taskId, limit: 50 });
      return payload.logs || payload.items || [];
    },
    staleTime: 15_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => taskService.create(payload),
    onSuccess: () => toast.success('Task created'),
    onSettled: (_data, _error, variables) => {
      invalidateTaskQueries(queryClient, variables?.project);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.update(id, payload),
    onSuccess: () => toast.success('Task updated'),
    onSettled: (_data, _error, variables) => {
      invalidateTaskQueries(queryClient, variables?.payload?.project);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.remove(id),
    onSuccess: () => toast.success('Task deleted'),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items) => taskService.reorder(items),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }) => taskService.comment(id, { text }),
    onSuccess: () => toast.success('Comment added'),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
}

export function useRequestTaskTimeExtension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.requestTimeExtension(id, payload),
    onSuccess: () => toast.success('Extra-time request submitted'),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['task-time-extension-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
    },
  });
}

export function usePendingTaskTimeExtensionRequests() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['task-time-extension-requests', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => taskService.pendingTimeExtensionRequests(),
  });
}

export function useApproveTaskTimeExtensionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.approveTimeExtensionRequest(id, payload),
    onSuccess: () => toast.success('Extra time approved'),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['task-time-extension-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
    },
  });
}

export function useRejectTaskTimeExtensionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.rejectTimeExtensionRequest(id, payload),
    onSuccess: () => toast.success('Extra time rejected'),
    onSettled: () => {
      invalidateTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['task-time-extension-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
    },
  });
}

function invalidateTaskQueries(queryClient, projectId) {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['task'] });
  queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['my-tasks-kanban'] });
  queryClient.invalidateQueries({ queryKey: ['task-counts'] });
  queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
  queryClient.invalidateQueries({ queryKey: ['employee'] });
  queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['timer-active'] });
  queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
  queryClient.invalidateQueries({ queryKey: ['reports'] });
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
  }
}
