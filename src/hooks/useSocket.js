import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { socket } from '../lib/socket';
import { useNotificationStore } from '../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const user = useAuthStore((state) => state.user);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const prependNotification = useNotificationStore((state) => state.prependNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return undefined;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join:user', user.id);
    if (['superadmin', 'admin', 'project_manager'].includes(user.role)) {
      socket.emit('join:admin');
    }

    const handleNotification = (notification) => {
      prependNotification(notification);
    };

    const handleUnreadCount = (payload) => {
      setUnreadCount(payload?.unreadCount ?? 0);
    };

    const currentUserId = String(user.id);

    const isCurrentUsersTimer = (payload) => {
      const payloadUserId = payload?.user?.id || payload?.user || payload?.userId;
      return Boolean(payloadUserId) && String(payloadUserId) === currentUserId;
    };

    const updateActiveTimerCache = (payload) => {
      if (!isCurrentUsersTimer(payload)) return;
      queryClient.setQueryData(['timer-active', currentUserId], payload);
    };

    const clearActiveTimerCache = (payload) => {
      if (!isCurrentUsersTimer(payload)) return;
      queryClient.setQueryData(['timer-active', currentUserId], null);
    };

    const handleProjectChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      queryClient.invalidateQueries({ queryKey: ['project-stages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['employee-workload'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-extension-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-overview'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    const handleTimerChanged = (payload) => {
      const isCurrentTimer = isCurrentUsersTimer(payload);
      if (isCurrentTimer) {
        updateActiveTimerCache(payload);
      }
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      if (isCurrentTimer) {
        queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      }
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    const handleTimerStopped = (payload) => {
      const isCurrentTimer = isCurrentUsersTimer(payload);
      if (isCurrentTimer) {
        clearActiveTimerCache(payload);
        queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      }
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    const handleMonitorPresenceChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['monitor'] });
    };

    socket.on('notification:new', handleNotification);
    socket.on('notification:count', handleUnreadCount);
    socket.on('project:created', handleProjectChanged);
    socket.on('project:updated', handleProjectChanged);
    socket.on('billing:updated', handleProjectChanged);
    socket.on('client:created', handleProjectChanged);
    socket.on('client:updated', handleProjectChanged);
    socket.on('client:deleted', handleProjectChanged);
    socket.on('task:created', handleProjectChanged);
    socket.on('task:updated', handleProjectChanged);
    socket.on('task:time-extension', handleProjectChanged);
    socket.on('task:deleted', handleProjectChanged);
    socket.on('stage:approved', handleProjectChanged);
    socket.on('timer:started', handleTimerChanged);
    socket.on('timer:stopped', handleTimerStopped);
    socket.on('timer:manual', handleProjectChanged);
    socket.on('timer:deleted', handleTimerStopped);
    socket.on('activity:created', handleProjectChanged);
    socket.on('monitor:presence:changed', handleMonitorPresenceChanged);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('notification:count', handleUnreadCount);
      socket.off('project:created', handleProjectChanged);
      socket.off('project:updated', handleProjectChanged);
      socket.off('billing:updated', handleProjectChanged);
      socket.off('client:created', handleProjectChanged);
      socket.off('client:updated', handleProjectChanged);
      socket.off('client:deleted', handleProjectChanged);
      socket.off('task:created', handleProjectChanged);
      socket.off('task:updated', handleProjectChanged);
      socket.off('task:time-extension', handleProjectChanged);
      socket.off('task:deleted', handleProjectChanged);
      socket.off('stage:approved', handleProjectChanged);
      socket.off('timer:started', handleTimerChanged);
      socket.off('timer:stopped', handleTimerStopped);
      socket.off('timer:manual', handleProjectChanged);
      socket.off('timer:deleted', handleTimerStopped);
      socket.off('activity:created', handleProjectChanged);
      socket.off('monitor:presence:changed', handleMonitorPresenceChanged);
      socket.emit('leave:user', user.id);
      if (['superadmin', 'admin', 'project_manager'].includes(user.role)) {
        socket.emit('leave:admin');
      }
    };
  }, [user?.id, user?.role, prependNotification, queryClient, setUnreadCount]);
}
