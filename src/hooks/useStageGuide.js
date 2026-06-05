import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stageGuideService } from '../services/stageGuideService';

export function useStageGuide() {
  return useQuery({
    queryKey: ['stage-guide'],
    queryFn: async () => {
      const rows = await stageGuideService.list();
      return rows || [];
    },
  });
}

export function useCreateStageGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stageGuideService.create(payload),
    onSuccess: () => toast.success('Stage guide row created'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stage-guide'] }),
  });
}

export function useUpdateStageGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => stageGuideService.update(id, payload),
    onSuccess: () => toast.success('Stage guide row updated'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stage-guide'] }),
  });
}

export function useDeleteStageGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => stageGuideService.remove(id),
    onSuccess: () => toast.success('Stage guide row deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stage-guide'] }),
  });
}
