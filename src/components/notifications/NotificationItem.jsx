import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function NotificationItem({ notification, onRead, onDelete, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition',
        notification?.isRead
          ? 'border-slate-200/80 bg-white/70 dark:border-[rgb(var(--line)/0.16)] dark:bg-[rgb(var(--panel-2)/0.78)]'
          : 'border-sky-400/20 bg-sky-500/10',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{notification.title}</div>
              <div className="mt-1 text-xs text-slate-500">{notification.message}</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!notification.isRead ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onRead?.(notification.id);
                }}
              >
                <Check className="h-4 w-4" />
                Mark read
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
