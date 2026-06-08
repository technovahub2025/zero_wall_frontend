import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { teamService } from '../services/teamService';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamService.getMembers(),
    staleTime: 60_000,
  });
}

export function usePendingInvites(options = {}) {
  return useQuery({
    queryKey: ['team-invites'],
    queryFn: () => teamService.getInvites(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => teamService.invite(payload),
    onSuccess: () => {
      toast.success('Invite sent');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-invites'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => teamService.resend(id),
    onSuccess: () => {
      toast.success('Invite resent');
      queryClient.invalidateQueries({ queryKey: ['team-invites'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => teamService.revokeInvite(id),
    onSuccess: () => {
      toast.success('Invite revoked');
      queryClient.invalidateQueries({ queryKey: ['team-invites'] });
    },
  });
}

export function useChangeMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => teamService.changeRole(id, payload),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => teamService.removeMember(id),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
    },
  });
}
