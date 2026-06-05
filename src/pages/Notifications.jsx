import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '../hooks/useNotifications';
import { FilterChips } from '../components/shared/FilterChips';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { EmptyState } from '../components/shared/EmptyState';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNotificationStore } from '../store/notificationStore';
import { VirtualList } from '../components/shared/VirtualList';
import { formatDate } from '../utils/formatters';

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Stages', value: 'stages' },
  { label: 'Billing', value: 'billing' },
];

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const query = useNotifications({
    type: filter,
    unread: filter === 'unread' ? 'true' : undefined,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const notifications = useMemo(() => query.data?.notifications || [], [query.data]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-amber p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Notifications</p>
            <h1 className="hero-title">Activity center</h1>
            <p className="hero-subtitle max-w-3xl">Realtime alerts, task updates, and billing reminders.</p>
          </div>
          <Button variant="secondary" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Unread" value={unreadCount || 0} hint="Needs your attention" />
        <Metric label="Total" value={notifications.length} hint="Visible in current filter" />
        <Metric label="Filter" value={filter.toUpperCase()} hint="Current inbox scope" />
      </div>

      <FilterChips value={filter} onChange={setFilter} options={filterOptions} />

      {query.isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : query.isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{query.error?.message || 'Failed to load notifications'}</div>
              <div className="text-xs text-slate-500">Try again after a moment.</div>
            </div>
            <Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>
          </CardBody>
        </Card>
      ) : notifications.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {notifications.length > 50 ? (
              <VirtualList
                items={notifications}
                estimateSize={156}
                className="h-[70vh] px-4 py-3"
                renderItem={(notification) => (
                  <div className="pb-3">
                    <NotificationRow notification={notification} onMarkRead={markRead} onDelete={deleteNotification} />
                  </div>
                )}
              />
            ) : (
              <div className="space-y-3 px-4 py-3">
                {notifications.map((notification) => (
                  <NotificationRow key={notification.id} notification={notification} onMarkRead={markRead} onDelete={deleteNotification} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <EmptyState title="No notifications" description="New activity will appear here automatically." />
      )}
    </motion.div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <Card>
      <CardBody>
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      </CardBody>
    </Card>
  );
}

function NotificationRow({ notification, onMarkRead, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="w-full rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.78)] p-4 text-left transition hover:bg-[rgb(var(--panel-2)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
      onClick={() => {
        if (notification.link) {
          window.location.assign(notification.link);
        }
        if (!notification.isRead) {
          onMarkRead.mutate(notification.id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (notification.link) {
            window.location.assign(notification.link);
          }
          if (!notification.isRead) {
            onMarkRead.mutate(notification.id);
          }
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{notification.title}</div>
          <div className="mt-1 text-sm text-slate-500">{notification.message}</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {formatDate(notification.createdAt, 'dd MMM yyyy, hh:mm a')}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">{notification.type}</div>
        <div className="flex gap-2">
          {!notification.isRead ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead.mutate(notification.id);
              }}
            >
              Mark read
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onDelete.mutate(notification.id);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
