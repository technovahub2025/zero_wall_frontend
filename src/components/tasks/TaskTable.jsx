import { DataTable } from '../shared/DataTable';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskCountdown } from './TaskCountdown';

export function TaskTable({ rows = [], onEdit, onDelete, onComment }) {
  return (
    <DataTable
      columns={[
        { key: 'title', label: 'Task' },
        { key: 'projectName', label: 'Project' },
        { key: 'assigneeName', label: 'Assignee' },
        { key: 'startDate', label: 'Start', hideOnMobile: true, render: (row) => row.startDate || '-' },
        { key: 'dueDate', label: 'Due', render: (row) => row.dueDate || '-' },
        { key: 'priority', label: 'Priority', render: (row) => <TaskPriorityBadge value={row.priority} /> },
        { key: 'status', label: 'Status', render: (row) => <TaskStatusBadge value={row.status} /> },
        { key: 'nextAction', label: 'Next Action', hideOnMobile: true, render: (row) => <span className="block max-w-[180px] truncate">{row.nextAction || '-'}</span> },
        { key: 'tags', label: 'Tags', hideOnMobile: true, render: (row) => <span className="block max-w-[180px] truncate">{Array.isArray(row.tags) ? row.tags.join(', ') : row.tags || '-'}</span> },
        { key: 'timer', label: 'Timer', render: (row) => <TaskCountdown dueDate={row.dueDate} /> },
        {
          key: 'actions',
          label: 'Actions',
          render: (row) => (
            <div className="flex gap-2">
              {onComment ? <button type="button" className="text-xs text-sky-300" onClick={() => onComment(row)}>Comment</button> : null}
              {onEdit ? <button type="button" className="text-xs text-slate-300" onClick={() => onEdit(row)}>Edit</button> : null}
              {onDelete ? <button type="button" className="text-xs text-rose-300" onClick={() => onDelete(row)}>Delete</button> : null}
            </div>
          ),
        },
      ]}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage="No tasks available."
    />
  );
}
