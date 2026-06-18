import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DataTable } from '../shared/DataTable';
import { formatDuration } from '../../store/timerStore';
import { formatIndiaDate, formatIndiaTime } from '../../utils/formatters';
import { getTimerActionLabel, getTimerActionTone, getTimerReason } from '../../utils/timerLogDisplay';

function safeDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date;
}

export function TimerLog({ logs = [], onDelete }) {
  return (
    <DataTable
      columns={[
        { key: 'date', label: 'Date', render: (row) => formatIndiaDate(safeDate(row.date || row.startTime)) },
        { key: 'task', label: 'Task', render: (row) => row.task?.title || row.task?.name || '-' },
        { key: 'project', label: 'Project', render: (row) => row.project?.projectName || row.project?.name || '-' },
        { key: 'start', label: 'Start', render: (row) => formatIndiaTime(safeDate(row.startTime)) },
        { key: 'end', label: 'Stop', render: (row) => (row.endTime ? formatIndiaTime(safeDate(row.endTime)) : '-') },
        { key: 'duration', label: 'Duration', render: (row) => formatDuration(row.duration) },
        { key: 'action', label: 'Action', render: (row) => <Badge tone={getTimerActionTone(row)}>{getTimerActionLabel(row)}</Badge> },
        { key: 'reason', label: 'Reason / Comment', hideOnMobile: true, render: (row) => getTimerReason(row) || '-' },
        { key: 'manual', label: 'Manual', hideOnMobile: true, render: (row) => <Badge tone={row.isManual ? 'amber' : 'slate'}>{row.isManual ? 'Yes' : 'No'}</Badge> },
        {
          key: 'actions',
          label: 'Delete',
          render: (row) => (
            <Button size="sm" variant="danger" onClick={() => onDelete?.(row)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ),
        },
      ]}
      rows={logs}
      rowKey={(row) => row.id || row._id}
      emptyMessage="No time logs found."
    />
  );
}
