import { useMemo } from 'react';
import { VirtualList } from '../shared/VirtualList';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DataTable } from '../shared/DataTable';
import { TaskPriorityBadge } from '../tasks/TaskPriorityBadge';
import { TaskStatusBadge } from '../tasks/TaskStatusBadge';

const VIRTUALIZE_THRESHOLD = 20;
const GRID_TEMPLATE = '42px minmax(14rem, 1.5fr) minmax(11rem, 1fr) 118px 108px minmax(10rem, 1fr) minmax(12rem, 1.2fr) minmax(11rem, 1fr) minmax(10rem, 1fr) 126px';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ActionItemsTable({ tasks = [], showApproveButtons = false, onApprove, onReject }) {
  const rows = useMemo(() => tasks || [], [tasks]);
  const shouldVirtualize = rows.length > VIRTUALIZE_THRESHOLD;

  const columns = useMemo(
    () => [
      { key: 'n', label: '#' },
      { key: 'projectName', label: 'Project' },
      { key: 'projectClient', label: 'Client' },
      { key: 'status', label: 'Status', render: (row) => <TaskStatusBadge value={row.status} /> },
      { key: 'priority', label: 'Priority', render: (row) => <TaskPriorityBadge value={row.priority} /> },
      { key: 'projectStage', label: 'Stage' },
      { key: 'nextAction', label: 'Next Action', render: (row) => row.description || row.nextAction || '-' },
      { key: 'assigneeName', label: 'Responsible Engineer', render: (row) => row.assigneeName || row.projectEngineer || 'Unassigned' },
      { key: 'dueDate', label: 'Target', render: (row) => formatDate(row.dueDate || row.targetDate) },
      { key: 'decision', label: 'Decision Needed', render: (row) => row.decision || row.comment || 'Pending' },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) =>
          showApproveButtons ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onApprove?.(row)}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => onReject?.(row)}>
                Reject
              </Button>
            </div>
          ) : (
            <Badge tone="slate">Review</Badge>
          ),
      },
    ],
    [onApprove, onReject, showApproveButtons],
  );

  return (
    <Card className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-white/92 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur">
      <CardHeader className="items-center justify-between bg-gradient-to-r from-white/96 via-white/92 to-sky-50/50">
        <div>
          <CardTitle>Executive project queue</CardTitle>
          <div className="mt-1 text-xs text-slate-500">Full project and decision data, sorted and scrollable for large sets.</div>
        </div>
        <div className="ml-auto text-xs uppercase tracking-[0.18em] text-slate-400">
          {rows.length} records
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {shouldVirtualize ? (
          <div className="overflow-hidden">
            <div
              className="grid border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur-xl"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              <span>#</span>
              <span>Project</span>
              <span>Client</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Stage</span>
              <span>Next Action</span>
              <span>Responsible Engineer</span>
              <span>Target</span>
              <span>Decision Needed</span>
              <span className="text-right">Actions</span>
            </div>

            <VirtualList
              items={rows}
              estimateSize={98}
              className="scrollbar-none h-[72vh] max-h-[72vh] overscroll-contain"
              renderItem={(row, index) => (
                <div className="px-2 py-2">
                  <div
                    className="grid items-start gap-3 rounded-3xl border border-[rgb(var(--line)/0.08)] bg-white/92 px-4 py-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.38)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-36px_rgba(15,23,42,0.44)]"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">{String(index + 1).padStart(2, '0')}</div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
                    </div>
                    <div className="min-w-0 text-sm text-slate-500">{row.projectClient || '-'}</div>
                    <div><TaskStatusBadge value={row.status} /></div>
                    <div><TaskPriorityBadge value={row.priority} /></div>
                    <div className="min-w-0 text-sm text-slate-600">{row.projectStage || '-'}</div>
                    <div className="min-w-0 text-sm text-slate-600">{row.description || row.nextAction || '-'}</div>
                    <div className="min-w-0 text-sm text-slate-600">{row.assigneeName || row.projectEngineer || 'Unassigned'}</div>
                    <div className="whitespace-nowrap text-sm text-slate-500">{formatDate(row.dueDate || row.targetDate)}</div>
                    <div className="min-w-0 text-sm text-slate-600">{row.decision || row.comment || 'Pending'}</div>
                    <div className="flex justify-end">
                      {showApproveButtons ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => onApprove?.(row)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => onReject?.(row)}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge tone="slate">Review</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row, index) => row.id || `${row.projectName}-${index}`}
            emptyMessage="No action items yet."
            scrollClassName="scrollbar-none max-h-[72vh] overscroll-contain pr-1"
            stickyHeader
            scrollAxis="y"
            rowClassName="transition duration-200 hover:bg-[rgb(var(--panel-2)/0.72)]"
          />
        )}
      </CardBody>
    </Card>
  );
}
