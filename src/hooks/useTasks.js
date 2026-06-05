import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { normalizeProject, normalizeTask } from '../lib/phase2';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../store/authStore';

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
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
    queryFn: async () => taskService.counts({ project: projectId }),
  });
}

export function useKanbanOverview() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['kanban-overview'],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const payload = await projectService.kanbanOverview();
      return {
        ...payload,
        projects: Array.isArray(payload.projects) ? payload.projects.map(normalizeProject) : [],
      };
    },
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = await taskService.get(id);
      return normalizeTask(payload);
    },
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

function invalidateTaskQueries(queryClient, projectId) {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['task'] });
  queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['my-tasks-kanban'] });
  queryClient.invalidateQueries({ queryKey: ['task-counts'] });
  queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
  }
}
