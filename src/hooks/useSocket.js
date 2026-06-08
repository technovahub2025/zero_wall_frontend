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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    };

    const handleUnreadCount = (payload) => {
      setUnreadCount(payload?.unreadCount ?? 0);
    };

    const handleProjectChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      queryClient.invalidateQueries({ queryKey: ['project-stages'] });
      queryClient.invalidateQueries({ queryKey: ['report-status'] });
      queryClient.invalidateQueries({ queryKey: ['report-priority'] });
      queryClient.invalidateQueries({ queryKey: ['report-task-status'] });
      queryClient.invalidateQueries({ queryKey: ['report-revenue-trend'] });
      queryClient.invalidateQueries({ queryKey: ['report-stage-completion'] });
      queryClient.invalidateQueries({ queryKey: ['report-engineer'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    };

    socket.on('notification:new', handleNotification);
    socket.on('notification:count', handleUnreadCount);
    socket.on('project:created', handleProjectChanged);
    socket.on('project:updated', handleProjectChanged);
    socket.on('billing:updated', handleProjectChanged);
    socket.on('client:created', handleProjectChanged);
    socket.on('client:updated', handleProjectChanged);
    socket.on('client:deleted', handleProjectChanged);
    socket.on('task:updated', handleProjectChanged);
    socket.on('stage:approved', handleProjectChanged);
    socket.on('activity:created', handleProjectChanged);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('notification:count', handleUnreadCount);
      socket.off('project:created', handleProjectChanged);
      socket.off('project:updated', handleProjectChanged);
      socket.off('billing:updated', handleProjectChanged);
      socket.off('client:created', handleProjectChanged);
      socket.off('client:updated', handleProjectChanged);
      socket.off('client:deleted', handleProjectChanged);
      socket.off('task:updated', handleProjectChanged);
      socket.off('stage:approved', handleProjectChanged);
      socket.off('activity:created', handleProjectChanged);
      socket.emit('leave:user', user.id);
      if (['superadmin', 'admin', 'project_manager'].includes(user.role)) {
        socket.emit('leave:admin');
      }
    };
  }, [user?.id, user?.role, prependNotification, queryClient, setUnreadCount]);
}
