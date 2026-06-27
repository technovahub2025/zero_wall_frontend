import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { normalizeStage } from '../lib/phase2';
import { stageService } from '../services/stageService';

export function useStages(projectId) {
  if (!projectId) {
    return {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: async () => ({ data: [] }),
    };
  }

  return useQuery({
    queryKey: ['stages', projectId || 'all'],
    queryFn: async () => {
      const rows = await stageService.list(projectId ? { project: projectId } : {});
      return rows.map(normalizeStage);
    },
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, payload }) => stageService.create(projectId, payload),
    onSuccess: () => toast.success('Stage created'),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['project-stages', variables?.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables?.projectId] });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => stageService.update(id, payload),
    onSuccess: () => toast.success('Stage updated'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => stageService.remove(id),
    onSuccess: () => toast.success('Stage deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useApproveStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => stageService.approve(id, payload),
    onSuccess: () => toast.success('Stage approval updated'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}
