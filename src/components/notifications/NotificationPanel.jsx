import { X, CheckCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { EmptyState } from '../shared/EmptyState';
import { NotificationItem } from './NotificationItem';
import { VirtualList } from '../shared/VirtualList';

export function NotificationPanel({ open, notifications = [], onClose, onRead, onDelete, onMarkAllRead }) {
  if (!open) return null;

  const renderNotification = (notification) => (
    <NotificationItem
      notification={notification}
      onRead={onRead}
      onDelete={onDelete}
      onClick={() => {
        if (notification.link) {
          window.location.assign(notification.link);
        }
        if (!notification.isRead) {
          onRead?.(notification.id);
        }
      }}
    />
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="absolute bottom-0 right-0 top-auto h-[100dvh] w-full max-w-none overflow-hidden rounded-t-[28px] p-0 sm:top-0 sm:h-full sm:max-w-md sm:rounded-none sm:p-4"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={onMarkAllRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardBody className="min-h-0 flex-1 overflow-hidden p-0">
            {notifications.length ? (
              notifications.length > 50 ? (
                <VirtualList
                  items={notifications}
                  estimateSize={140}
                  className="h-[calc(100vh-140px)] px-4 py-3"
                  renderItem={(notification) => <div className="pb-3">{renderNotification(notification)}</div>}
                />
              ) : (
                <div className="space-y-3 overflow-y-auto px-4 py-3">
                  {notifications.map((notification) => (
                    <div key={notification.id}>{renderNotification(notification)}</div>
                  ))}
                </div>
              )
            ) : (
              <div className="px-4 py-3">
                <EmptyState title="No notifications" description="New activity will appear here." />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
