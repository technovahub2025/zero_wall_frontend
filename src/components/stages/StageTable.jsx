import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Check, CircleX, MoreVertical, PencilLine, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DataTable } from '../shared/DataTable';
import { cn } from '../../lib/utils';

function formatDate(value) {
  if (value === undefined || value === null || value === '' || value === '-') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy');
}

export function StageTable({
  rows = [],
  onEdit,
  onDelete,
  onApprove,
  onReject,
  stickyHeader = false,
  scrollAxis = 'x',
  scrollClassName = '',
  showProject = false,
  rowKey,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }

    function handleScrollOrResize() {
      setOpenMenuId(null);
      setMenuPosition(null);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const menuItems = useMemo(
    () => [
      onApprove ? { key: 'approve', label: 'Approve', icon: Check, tone: 'emerald', action: onApprove } : null,
      onReject ? { key: 'reject', label: 'Reject', icon: CircleX, tone: 'amber', action: onReject } : null,
      onEdit ? { key: 'edit', label: 'Edit', icon: PencilLine, tone: 'slate', action: onEdit } : null,
      onDelete ? { key: 'delete', label: 'Delete', icon: Trash2, tone: 'rose', action: onDelete } : null,
    ].filter(Boolean),
    [onApprove, onDelete, onEdit, onReject],
  );

  return (
    <>
      <DataTable
        columns={[
          showProject
            ? {
                key: 'projectName',
                label: 'Project',
                render: (row) => (
                  <span className="block max-w-[180px] truncate font-semibold text-[rgb(var(--text))]">
                    {row.project?.projectName || row.projectName || '-'}
                  </span>
                ),
              }
            : null,
          { key: 'stageNo', label: 'Stage No', render: (row) => <span className="whitespace-nowrap font-medium">{row.stageNo}</span> },
          { key: 'stageName', label: 'Stage Name', render: (row) => <span className="font-semibold text-[rgb(var(--text))]">{row.stageName}</span> },
          { key: 'stageDescription', label: 'Description', render: (row) => <span className="block max-w-[180px] truncate text-[rgb(var(--muted))]">{row.stageDescription || '-'}</span> },
          { key: 'stageStart', label: 'Start', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--muted))]">{formatDate(row.stageStart)}</span> },
          { key: 'stageEndPlanned', label: 'End (Planned)', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--muted))]">{formatDate(row.stageEndPlanned)}</span> },
          { key: 'stageEndActual', label: 'End (Actual)', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--muted))]">{formatDate(row.stageEndActual)}</span> },
          {
            key: 'stageStatus',
            label: 'Status',
            render: (row) => <Badge tone={row.stageStatus === 'Completed' ? 'green' : row.stageStatus === 'In Progress' ? 'blue' : 'amber'}>{row.stageStatus}</Badge>,
          },
          { key: 'responsibleEngineer', label: 'Responsible Engineer', hideOnMobile: true, render: (row) => <span className="block max-w-[160px] truncate font-medium text-[rgb(var(--text))]">{row.responsibleEngineer?.name || '-'}</span> },
          { key: 'approvalRequired', label: 'Approval Req.', hideOnMobile: true, render: (row) => <span className="block max-w-[180px] truncate font-medium text-[rgb(var(--text))]">{row.approvalRequired || '-'}</span> },
          { key: 'disciplines', label: 'Disciplines', hideOnMobile: true, render: (row) => <span className="block max-w-[180px] truncate font-medium text-[rgb(var(--text))]">{row.disciplines || '-'}</span> },
          { key: 'duration', label: 'Duration', hideOnMobile: true, render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--text))]">{row.duration || '-'}</span> },
          { key: 'deliverable', label: 'Deliverable', render: (row) => <span className="block max-w-[160px] truncate font-medium text-[rgb(var(--text))]">{row.deliverable || '-'}</span> },
          { key: 'submittedToClientOn', label: 'Submitted On', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--muted))]">{formatDate(row.submittedToClientOn)}</span> },
          { key: 'clientApprovalStatus', label: 'Client Approval', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--text))]">{row.clientApprovalStatus || '-'}</span> },
          { key: 'clientApprovalDate', label: 'Approval Date', render: (row) => <span className="whitespace-nowrap font-medium text-[rgb(var(--muted))]">{formatDate(row.clientApprovalDate)}</span> },
          { key: 'clientComments', label: 'Client Comments', render: (row) => <span className="block max-w-[180px] truncate text-[rgb(var(--muted))]">{row.clientComments || '-'}</span> },
          { key: 'nextAction', label: 'Next Action', render: (row) => <span className="block max-w-[160px] truncate text-[rgb(var(--muted))]">{row.nextAction || '-'}</span> },
          menuItems.length
            ? {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <div className="relative inline-flex justify-end" ref={openMenuId === row.id ? menuRef : null}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-10 w-10 rounded-xl border border-[rgb(var(--line)/0.18)] bg-[rgb(var(--panel)/0.94)] px-0 text-[rgb(var(--text))] shadow-sm transition hover:border-[rgb(var(--line)/0.28)] hover:bg-[rgb(var(--panel-2)/0.92)] hover:text-[rgb(var(--text))]"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (openMenuId === row.id) {
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          return;
                        }

                        const rect = event.currentTarget.getBoundingClientRect();
                        const menuHeight = menuItems.length * 48;
                        const estimatedLeft = rect.right - 46;
                        const estimatedTop =
                          rect.bottom + menuHeight < window.innerHeight - 12
                            ? rect.bottom + 10
                            : Math.max(12, rect.top - menuHeight - 10);
                        const clampedLeft = Math.min(Math.max(estimatedLeft, 8), window.innerWidth - 62);

                        setMenuPosition({ top: estimatedTop, left: clampedLeft });
                        setOpenMenuId(row.id);
                      }}
                      aria-label="Stage actions"
                      title="Stage actions"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                ),
              }
            : null,
        ].filter(Boolean)}
        rows={rows}
        rowKey={rowKey || ((row, index) => row.id || row._id || `${row.projectId || row.projectName || 'stage'}-${row.stageNo}-${row.stageName}-${index}`)}
        emptyMessage="No stage records yet."
        stickyHeader={stickyHeader}
        scrollAxis={scrollAxis}
        scrollClassName={scrollClassName}
      />
      {openMenuId && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[120] flex w-14 flex-col gap-2 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] p-2 shadow-2xl backdrop-blur"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {rows
                .filter((row) => row.id === openMenuId)
                .map((row) => (
                  <div key={row.id} className="flex flex-col gap-2">
                    {menuItems.map(({ key, label, icon: Icon, action, tone }) => (
                      <button
                        key={key}
                        type="button"
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl transition',
                          tone === 'rose'
                            ? 'text-rose-500 hover:bg-rose-500/10'
                            : tone === 'emerald'
                              ? 'text-emerald-500 hover:bg-emerald-500/10'
                              : tone === 'amber'
                                ? 'text-amber-500 hover:bg-amber-500/10'
                                : 'text-[rgb(var(--text))] hover:bg-slate-50',
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          action(row);
                        }}
                        aria-label={label}
                        title={label}
                      >
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-lg',
                            tone === 'rose'
                              ? 'bg-rose-500/10 text-rose-400'
                              : tone === 'emerald'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : tone === 'amber'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="sr-only">{label}</span>
                      </button>
                    ))}
                  </div>
                ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
