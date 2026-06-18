import { Check, Loader2, Minus, Trash2 } from 'lucide-react';
import { DataTable } from '../shared/DataTable';
import { Badge } from '../ui/badge';
import { KanbanActionsMenu } from '../kanban/KanbanActionsMenu';
import { formatDuration } from '../../store/timerStore';
import { formatIndiaDate, formatIndiaTime } from '../../utils/formatters';
import { getTimerActionLabel, getTimerActionTone, getTimerReason } from '../../utils/timerLogDisplay';

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value) {
  const date = safeDate(value);
  return formatIndiaDate(date);
}

function formatTime(value) {
  const date = safeDate(value);
  return formatIndiaTime(date);
}

function SelectionCheckbox({ checked = false, indeterminate = false, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
        checked || indeterminate
          ? 'border-sky-500 bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.24)]'
          : 'border-[rgb(var(--line)/0.22)] bg-white text-transparent hover:border-sky-300 hover:bg-sky-50'
      }`}
    >
      {indeterminate ? <Minus className="h-3.5 w-3.5" /> : checked ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-[3px] bg-transparent" />}
    </button>
  );
}

export function TimesheetTable({
  rows = [],
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  onDelete,
  onToggleBillable,
  canEditBillable = false,
  canDelete = false,
  billableUpdatingIds = [],
  showSelectionColumn = false,
  scrollClassName = '',
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(String(row.id || row._id)));
  const someSelected = rows.some((row) => selectedIds.includes(String(row.id || row._id)));
  const updatingSet = new Set(billableUpdatingIds.map(String));
  const selectionColumns = showSelectionColumn
    ? [
        {
          key: 'select',
          label: (
            <SelectionCheckbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onChange={(nextChecked) => onToggleAll?.(nextChecked)}
              label="Select all rows"
            />
          ),
          render: (row) => (
            <SelectionCheckbox
              checked={selectedIds.includes(String(row.id || row._id))}
              onChange={() => onToggleRow?.(row.id || row._id)}
              label={`Select row ${row.id || row._id}`}
            />
          ),
          className: 'w-12',
        },
      ]
    : [];

  return (
    <DataTable
      columns={[
        ...selectionColumns,
        { key: 'date', label: 'Date', render: (row) => formatDate(row.date || row.startTime) },
        { key: 'project', label: 'Project', render: (row) => row.project?.projectName || row.projectName || '-' },
        { key: 'task', label: 'Task', render: (row) => row.task?.title || row.taskTitle || '-' },
        { key: 'start', label: 'Start', render: (row) => formatTime(row.startTime) },
        { key: 'end', label: 'Stop', render: (row) => formatTime(row.endTime) },
        { key: 'duration', label: 'Duration', render: (row) => formatDuration(row.duration) },
        { key: 'action', label: 'Action', render: (row) => <Badge tone={getTimerActionTone(row)}>{getTimerActionLabel(row)}</Badge> },
        { key: 'reason', label: 'Reason / Comment', hideOnMobile: true, render: (row) => getTimerReason(row) || '-' },
        {
          key: 'billable',
          label: 'Billable',
          render: (row) => {
            const rowId = String(row.id || row._id || '');
            const isUpdating = updatingSet.has(rowId);
            if (!canEditBillable) {
              return <Badge tone={row.isBillable ? 'green' : 'slate'}>{row.isBillable ? 'Billable' : 'Non-billable'}</Badge>;
            }
            return (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onToggleBillable?.(row)}
                className={`inline-flex min-w-[116px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition disabled:cursor-wait disabled:opacity-70 ${
                  row.isBillable
                    ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-400/25 hover:bg-emerald-500/20'
                    : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200/70'
                }`}
                title={row.isBillable ? 'Click to mark non-billable' : 'Click to mark billable'}
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {row.isBillable ? 'Billable' : 'Non-billable'}
              </button>
            );
          },
        },
        { key: 'manual', label: 'Manual', hideOnMobile: true, render: (row) => <Badge tone={row.isManual ? 'amber' : 'slate'}>{row.isManual ? 'Yes' : 'No'}</Badge> },
        {
          key: 'actions',
          label: 'Actions',
          render: (row) => (
            <KanbanActionsMenu
              items={[
                canEditBillable
                  ? {
                      key: 'toggle-billable',
                      label: row.isBillable ? 'Mark non-billable' : 'Mark billable',
                      disabled: updatingSet.has(String(row.id || row._id || '')),
                      onClick: () => onToggleBillable?.(row),
                    }
                  : null,
                canDelete
                  ? {
                      key: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      tone: 'danger',
                      onClick: () => onDelete?.(row),
                    }
                  : null,
              ].filter(Boolean)}
              align="right"
              triggerClassName="h-10 w-10 rounded-xl border border-[rgb(var(--line)/0.18)] bg-white/95 px-0 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            />
          ),
        },
      ]}
      rows={rows}
      rowKey={(row) => row.id || row._id}
      emptyMessage="No time logs found."
      scrollClassName={scrollClassName}
      scrollAxis="y"
      stickyHeader
      onRowClick={(row) => onToggleRow?.(row.id || row._id)}
      rowClassName={(row) => (selectedIds.includes(String(row.id || row._id)) ? 'bg-sky-50/70' : '')}
    />
  );
}
