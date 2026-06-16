import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bell, CheckCheck, Clock3, Filter, Inbox, Layers3, ReceiptText, Route, ShieldAlert, SquareKanban, ListTodo, Trash2 } from 'lucide-react';
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
  const unreadVisible = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );
  const stats = useMemo(
    () => [
      { label: 'Unread', value: unreadCount || 0, hint: 'Needs your attention', icon: Bell, tone: 'blue' },
      { label: 'Visible', value: notifications.length, hint: 'In current filter', icon: Inbox, tone: 'amber' },
      { label: 'Read', value: Math.max(0, notifications.length - unreadVisible), hint: 'Already processed', icon: CheckCheck, tone: 'green' },
    ],
    [notifications.length, unreadCount, unreadVisible],
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-amber relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              <Layers3 className="h-3.5 w-3.5" />
              Live inbox
            </div>
            <p className="hero-kicker">Notifications</p>
            <h1 className="hero-title">Activity center</h1>
            <p className="hero-subtitle max-w-3xl">Realtime alerts, task updates, and billing reminders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <Metric key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips value={filter} onChange={setFilter} options={filterOptions} />
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.76)] px-3 py-2 text-xs font-medium text-[rgb(var(--muted))]">
          <Filter className="h-4 w-4" />
          {filter === 'all' ? 'All notifications' : `${filter} notifications`}
        </div>
      </div>

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
        <Card className="overflow-hidden">
          <CardHeader className="items-start justify-between gap-3 border-b border-[rgb(var(--line)/0.12)] bg-[linear-gradient(180deg,rgb(var(--panel)/0.9),rgb(var(--panel-2)/0.72))]">
            <div>
              <CardTitle>Recent notifications</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Scroll inside the list to review older activity without moving the page.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.78)] px-3 py-1 text-xs text-[rgb(var(--muted))]">
              <Inbox className="h-4 w-4" />
              {notifications.length} items
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {notifications.length > 50 ? (
              <VirtualList
                items={notifications}
                estimateSize={156}
                className="h-[calc(100vh-26rem)] px-4 py-3"
                renderItem={(notification) => (
                  <div className="pb-3">
                    <NotificationRow notification={notification} onMarkRead={markRead} onDelete={deleteNotification} />
                  </div>
                )}
              />
            ) : (
              <div className="max-h-[calc(100vh-26rem)] overflow-y-auto px-4 py-3 pr-1">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} onMarkRead={markRead} onDelete={deleteNotification} />
                  ))}
                </div>
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

function Metric({ label, value, hint, icon: Icon, tone = 'slate' }) {
  const toneClasses = {
    blue: 'border-sky-200/60 bg-sky-500/10 text-sky-700',
    amber: 'border-amber-200/60 bg-amber-500/10 text-amber-700',
    green: 'border-emerald-200/60 bg-emerald-500/10 text-emerald-700',
    slate: 'border-slate-200/60 bg-slate-500/10 text-slate-700',
  };

  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <Icon className="h-3.5 w-3.5 text-slate-400" />
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </div>
        <div className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${toneClasses[tone] || toneClasses.slate}`}>
          {label}
        </div>
      </CardBody>
    </Card>
  );
}

function NotificationRow({ notification, onMarkRead, onDelete }) {
  const type = String(notification.type || '').toLowerCase();
  const Icon =
    type.includes('billing') ? ReceiptText :
    type.includes('stage') ? Route :
    type.includes('task') ? ListTodo :
    type.includes('time') ? Clock3 :
    type.includes('approval') ? ShieldAlert :
    type.includes('kanban') ? SquareKanban :
    Bell;

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
        <div className="flex min-w-0 gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.isRead ? 'bg-slate-500/10 text-[rgb(var(--muted))]' : 'bg-sky-500/12 text-sky-500'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{notification.title}</div>
            <div className="mt-1 text-sm text-slate-500">{notification.message}</div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {formatDate(notification.createdAt, 'dd MMM yyyy, hh:mm a')}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.7)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
          <Icon className="h-3.5 w-3.5" />
          <span>{notification.type}</span>
        </div>
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
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
