import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { normalizeProject } from '../lib/phase2';
import { projectService } from '../services/projectService';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

function canReadProjectList(role) {
  return ['superadmin', 'admin', 'project_manager'].includes(role);
}

async function loadProjects(filters = {}) {
  const rows = await projectService.list(filters);
  return rows.map(normalizeProject);
}

function sanitizeProjectFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (value === 'all') return false;
      return true;
    }),
  );
}

export function useProjects(extraFilters = {}, queryOptions = {}) {
  const filters = useProjectStore((state) => state.filters);
  const role = useAuthStore((state) => state.user?.role);
  const merged = sanitizeProjectFilters({ ...filters, ...extraFilters });

  return useQuery({
    queryKey: ['projects', merged],
    enabled: Boolean(role && canReadProjectList(role)) && (queryOptions.enabled ?? true),
    staleTime: queryOptions.staleTime ?? 5 * 60_000,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    queryFn: () => loadProjects(merged),
    ...queryOptions,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const payload = await projectService.get(id);
      return normalizeProject(payload);
    },
  });
}

export function useProjectSummary(id) {
  return useQuery({
    queryKey: ['project-summary', id],
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => projectService.summary(id),
  });
}

export function useProjectStages(id, queryOptions = {}) {
  return useQuery({
    queryKey: ['project-stages', id],
    enabled: Boolean(id),
    queryFn: async () => projectService.stages(id),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => projectService.create(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData(['projects']);
      const optimistic = normalizeProject({ ...payload, id: `temp-${Date.now()}` });
      queryClient.setQueryData(['projects'], (current = []) => [optimistic, ...current]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['projects'], context.previous);
      toast.error('Failed to create project');
    },
    onSuccess: () => {
      toast.success('Project created');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => projectService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData(['projects']);
      queryClient.setQueryData(['projects'], (current = []) =>
        current.map((item) => (item.id === id ? normalizeProject({ ...item, ...payload, id }) : item)),
      );
      queryClient.setQueryData(['project', id], (current) => (current ? normalizeProject({ ...current, ...payload, id }) : current));
      return { previous };
    },
    onSuccess: (data, variables) => {
      const updatedProject = normalizeProject(data);
      const projectId = variables?.id || updatedProject.id;

      queryClient.setQueryData(['project', projectId], updatedProject);
      queryClient.setQueryData(['projects'], (current = []) =>
        current.map((item) => (item.id === projectId ? normalizeProject({ ...item, ...updatedProject, id: projectId }) : item)),
      );
      queryClient.setQueryData(['project-summary', projectId], (current) =>
        current ? { ...current, project: updatedProject, data: { ...current.data, project: updatedProject } } : current,
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['projects'], context.previous);
      toast.error('Failed to update project');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables?.id] });
      queryClient.invalidateQueries({ queryKey: ['project-summary', variables?.id] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => projectService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData(['projects']);
      queryClient.setQueryData(['projects'], (current = []) => current.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['projects'], context.previous);
      toast.error('Failed to delete project');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items) => projectService.reorder(items),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useExportProjects() {
  return useMutation({
    mutationFn: () => projectService.exportRows(),
  });
}
