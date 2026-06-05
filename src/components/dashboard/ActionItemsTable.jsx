import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DataTable } from '../shared/DataTable';
import { TaskPriorityBadge } from '../tasks/TaskPriorityBadge';
import { TaskStatusBadge } from '../tasks/TaskStatusBadge';

export function ActionItemsTable({ tasks = [], showApproveButtons = false, onApprove, onReject }) {
  const rows = tasks.slice(0, 6);
  return (
    <DataTable
      columns={[
        { key: 'n', label: '#' },
        { key: 'projectName', label: 'Project' },
        { key: 'projectClient', label: 'Client' },
        { key: 'status', label: 'Status', render: (row) => <TaskStatusBadge value={row.status} /> },
        { key: 'priority', label: 'Priority', render: (row) => <TaskPriorityBadge value={row.priority} /> },
        { key: 'projectStage', label: 'Stage' },
        { key: 'nextAction', label: 'Next Action', render: (row) => row.description || row.nextAction || '-' },
        { key: 'assigneeName', label: 'Responsible Engineer', render: (row) => row.assigneeName || row.projectEngineer || 'Unassigned' },
        { key: 'dueDate', label: 'Target', render: (row) => row.dueDate || row.targetDate || '-' },
        { key: 'decision', label: 'Decision Needed', render: (row) => row.decision || row.comment || 'Pending' },
        {
          key: 'actions',
          label: 'Actions',
          render: (row) => (showApproveButtons ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onApprove?.(row)}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => onReject?.(row)}>Reject</Button>
            </div>
          ) : <Badge tone="slate">Review</Badge>),
        },
      ]}
      rows={rows}
      rowKey={(row, index) => row.id || `${row.projectName}-${index}`}
      emptyMessage="No action items yet."
    />
  );
}
