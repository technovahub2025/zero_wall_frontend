import { Users, Mail, Phone, BadgeInfo } from 'lucide-react';
import { Card, CardBody } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { buildAvatarUrl } from '../../utils/avatarUrl';

export function EmployeeCard({ employee, onEdit, onOpen, onDeactivate }) {
  const avatarSrc = buildAvatarUrl(employee.avatar, employee.updatedAt);

  return (
    <Card className="transition hover:translate-y-[-1px]">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-lg font-semibold text-white">
            {avatarSrc ? <img src={avatarSrc} alt={employee.name} className="h-full w-full object-cover" /> : (employee.name || 'E')[0]}
          </div>
          <div className="min-w-0 flex-1">
            <button type="button" className="text-left" onClick={() => onOpen?.(employee)}>
              <div className="truncate font-semibold text-[rgb(var(--text))]">{employee.name}</div>
              <div className="mt-1 text-xs text-slate-400">{employee.designation || 'Employee'}</div>
            </button>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">{employee.employeeId || 'Pending'}</Badge>
              <Badge tone={employee.isActive ? 'green' : 'rose'}>{employee.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" />{employee.email}</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" />{employee.phone || '-'}</div>
          <div className="flex items-center gap-2"><BadgeInfo className="h-4 w-4 text-slate-500" />{employee.department || '-'}</div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit?.(employee)}>Edit</Button>
          <Button size="sm" variant="secondary" onClick={() => onOpen?.(employee)}><Users className="h-4 w-4" />Open</Button>
          {onDeactivate ? <Button size="sm" variant="danger" onClick={() => onDeactivate?.(employee)}>Deactivate</Button> : null}
        </div>
      </CardBody>
    </Card>
  );
}
