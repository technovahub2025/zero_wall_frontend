import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeInfo, Building2, CircleUserRound, Mail, Phone, PencilLine, RefreshCw, ShieldX, Trash2, UserRound } from 'lucide-react';
import { Badge } from '../ui/badge';
import { KanbanActionsMenu } from '../kanban/KanbanActionsMenu';
import { DataTable } from '../shared/DataTable';
import { buildAvatarUrl } from '../../utils/avatarUrl';

function getRoleTone(role) {
  if (role === 'admin') return 'amber';
  if (role === 'project_manager') return 'blue';
  return 'slate';
}

function getStatusTone(isActive) {
  return isActive ? 'green' : 'rose';
}

function formatLastLogin(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function EmployeeTable({ rows = [], onEdit, onOpen, onToggleStatus, onDelete }) {
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Employee',
        className: 'min-w-[240px]',
        render: (row) => (
          <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => onOpen?.(row)}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-base font-semibold text-white shadow-sm">
              {buildAvatarUrl(row.avatar, row.updatedAt) ? (
                <img src={buildAvatarUrl(row.avatar, row.updatedAt)} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-[rgb(var(--text))]">{row.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="whitespace-nowrap">{row.employeeId || 'Pending ID'}</span>
                <span className="text-slate-300">•</span>
                <Badge tone={getRoleTone(row.role)}>{row.role || 'employee'}</Badge>
              </div>
            </div>
          </button>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        className: 'min-w-[240px]',
        render: (row) => (
          <span className="inline-flex min-w-0 items-center gap-2 text-[rgb(var(--text))]">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{row.email || '-'}</span>
          </span>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        className: 'min-w-[180px]',
        render: (row) => (
          <span className="inline-flex min-w-0 items-center gap-2 text-[rgb(var(--text))]">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{row.phone || '-'}</span>
          </span>
        ),
      },
      {
        key: 'designation',
        label: 'Designation',
        className: 'min-w-[180px]',
        render: (row) => (
          <span className="inline-flex min-w-0 items-center gap-2 text-[rgb(var(--text))]">
            <CircleUserRound className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{row.designation || '-'}</span>
          </span>
        ),
      },
      {
        key: 'department',
        label: 'Department',
        className: 'min-w-[160px]',
        render: (row) => (
          <span className="inline-flex min-w-0 items-center gap-2 text-[rgb(var(--text))]">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{row.department || '-'}</span>
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        className: 'min-w-[120px]',
        render: (row) => <Badge tone={getStatusTone(row.isActive)}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        hideOnMobile: true,
        className: 'min-w-[140px]',
        render: (row) => (
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-slate-500">
            <BadgeInfo className="h-4 w-4" />
            {formatLastLogin(row.lastLogin)}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        className: 'w-[84px] whitespace-nowrap text-right',
        render: (row) => (
          <div className="flex justify-end">
            <KanbanActionsMenu
              align="right"
              triggerClassName="h-9 w-9 rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              items={[
                {
                  key: 'open',
                  label: 'Open profile',
                  icon: UserRound,
                  onClick: () => {
                    if (onOpen) onOpen(row);
                    else navigate(`/employees/${row.id}`);
                  },
                },
                onEdit
                  ? {
                      key: 'edit',
                      label: 'Edit profile',
                      icon: PencilLine,
                      onClick: () => onEdit?.(row),
                    }
                  : null,
                onToggleStatus
                  ? {
                      key: 'status',
                      label: row.isActive ? 'Deactivate' : 'Activate',
                      icon: row.isActive ? ShieldX : RefreshCw,
                      tone: row.isActive ? 'danger' : 'default',
                      onClick: () => onToggleStatus?.(row),
                    }
                  : null,
                onDelete
                  ? {
                      key: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      tone: 'danger',
                      onClick: () => onDelete?.(row),
                    }
                  : null,
              ]}
            />
          </div>
        ),
      },
    ],
    [navigate, onDelete, onEdit, onOpen, onToggleStatus],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage="No employees found."
      scrollClassName="max-h-[calc(100dvh-24rem)] overflow-auto pr-1"
      stickyHeader
    />
  );
}
