import { Card, CardBody } from '../ui/card';

export function OrgSettings({ org }) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="text-sm font-semibold text-[rgb(var(--text))]">{org?.name || 'PG Infrastructure'}</div>
        <div className="text-sm text-slate-500">{org?.email || '-'}</div>
        <div className="text-xs text-slate-400">{org?.clientUrl || '-'}</div>
      </CardBody>
    </Card>
  );
}
