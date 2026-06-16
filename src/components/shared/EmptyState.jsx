import { Inbox } from 'lucide-react';
import { Card, CardBody } from '../ui/card';

export function EmptyState({ title = 'Nothing here yet', description = 'No records matched your current filters.', action }) {
  return (
    <Card>
      <CardBody className="grid place-items-center py-16 text-center">
        <div className="max-w-md">
          <Inbox className="mx-auto h-12 w-12 text-[rgb(var(--muted))]" />
          <h3 className="mt-4 font-display text-xl font-semibold text-[rgb(var(--text))]">{title}</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </CardBody>
    </Card>
  );
}
