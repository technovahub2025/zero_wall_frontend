import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';

export function useNotifications(params = {}, queryOptions = {}) {
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useQuery({
    queryKey: ['notifications', params],
    enabled: queryOptions.enabled ?? true,
    staleTime: queryOptions.staleTime ?? 60_000,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    queryFn: async () => {
      const payload = await notificationService.list(params);
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
      return payload;
    },
    ...queryOptions,
  });
}

export function useUnreadNotificationCount(queryOptions = {}) {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  return useQuery({
    queryKey: ['notification-count'],
    staleTime: queryOptions.staleTime ?? 60_000,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? false,
    queryFn: async () => {
      const payload = await notificationService.unreadCount();
      setUnreadCount(payload?.unreadCount ?? 0);
      return payload;
    },
    ...queryOptions,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const updateNotification = useNotificationStore((state) => state.updateNotification);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onMutate: async (id) => {
      updateNotification(id, { isRead: true });
    },
    onSuccess: (data) => {
      setUnreadCount(data?.unreadCount ?? 0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
    onError: () => toast.error('Failed to update notification'),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      markAllRead();
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
    onError: () => toast.error('Failed to mark notifications'),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  return useMutation({
    mutationFn: (id) => notificationService.remove(id),
    onMutate: async (id) => {
      removeNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
    onError: () => toast.error('Failed to delete notification'),
  });
}
