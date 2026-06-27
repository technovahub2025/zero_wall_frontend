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

    const pendingInvalidations = new Map();
    let invalidationTimer = null;

    const scheduleInvalidation = (queryKey, options = {}) => {
      const key = JSON.stringify(queryKey);
      pendingInvalidations.set(key, { queryKey, ...options });
      if (invalidationTimer) return;

      invalidationTimer = window.setTimeout(() => {
        const invalidations = Array.from(pendingInvalidations.values());
        pendingInvalidations.clear();
        invalidationTimer = null;
        invalidations.forEach((payload) => queryClient.invalidateQueries(payload));
      }, 750);
    };

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
      [
        ['dashboard'],
        ['projects'],
        ['project'],
        ['project-summary'],
        ['project-stages'],
        ['tasks'],
        ['project-tasks'],
        ['task-counts'],
        ['my-tasks'],
        ['my-tasks-kanban'],
        ['employee'],
        ['employee-tasks'],
        ['employee-workload'],
        ['task-time-extension-requests'],
        ['timer-active'],
        ['stages'],
        ['kanban-overview'],
        ['reports'],
        ['clients'],
      ].forEach((queryKey) => scheduleInvalidation(queryKey));
    };

    const handleTimerChanged = (payload) => {
      const isCurrentTimer = isCurrentUsersTimer(payload);
      if (isCurrentTimer) {
        updateActiveTimerCache(payload);
      }
      scheduleInvalidation(['timer-logs']);
      scheduleInvalidation(['timesheets']);
      if (isCurrentTimer) {
        scheduleInvalidation(['timer-active']);
      }
      scheduleInvalidation(['my-tasks']);
      scheduleInvalidation(['task-counts']);
      scheduleInvalidation(['project-tasks']);
      scheduleInvalidation(['reports']);
      scheduleInvalidation(['dashboard']);
    };

    const handleTimerStopped = (payload) => {
      const isCurrentTimer = isCurrentUsersTimer(payload);
      if (isCurrentTimer) {
        clearActiveTimerCache(payload);
        scheduleInvalidation(['timer-active']);
      }
      scheduleInvalidation(['timer-logs']);
      scheduleInvalidation(['timesheets']);
      scheduleInvalidation(['my-tasks']);
      scheduleInvalidation(['task-counts']);
      scheduleInvalidation(['project-tasks']);
      scheduleInvalidation(['reports']);
      scheduleInvalidation(['dashboard']);
    };

    const handleMonitorPresenceChanged = () => {
      scheduleInvalidation(['monitor']);
    };

    const handleActivityCreated = () => {
      scheduleInvalidation(['activity-logs']);
      scheduleInvalidation(['dashboard']);
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
    socket.on('activity:created', handleActivityCreated);
    socket.on('monitor:presence:changed', handleMonitorPresenceChanged);

    return () => {
      if (invalidationTimer) {
        window.clearTimeout(invalidationTimer);
      }
      pendingInvalidations.clear();
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
      socket.off('activity:created', handleActivityCreated);
      socket.off('monitor:presence:changed', handleMonitorPresenceChanged);
      socket.emit('leave:user', user.id);
      if (['superadmin', 'admin', 'project_manager'].includes(user.role)) {
        socket.emit('leave:admin');
      }
    };
  }, [user?.id, user?.role, prependNotification, queryClient, setUnreadCount]);
}
