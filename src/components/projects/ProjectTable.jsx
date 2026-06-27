import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, MoreVertical, PencilLine, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DataTable } from '../shared/DataTable';
import { ProjectStatusBadge } from './ProjectStatusBadge';

export function ProjectTable({
  rows = [],
  onEdit,
  onDelete,
  selectedIds = [],
  onToggleRowSelection,
  showSelection = false,
  compact = false,
}) {
  const navigate = useNavigate();
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

  const baseColumns = useMemo(() => ([
    {
      key: 'projectName',
      label: 'Project',
      render: (row) => (
        <button type="button" onClick={() => navigate(`/projects/${row.id}`)} className="text-left">
          <div className="font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
          <div className="text-xs text-slate-400">{row.clientName}</div>
        </button>
      ),
    },
    { key: 'companySegment', label: 'Segment', hideOnMobile: true },
    { key: 'location', label: 'Location', hideOnMobile: true },
    {
      key: 'responsibleEngineer',
      label: 'Responsible Engineer',
      hideOnMobile: true,
      render: (row) => {
        const value = row.responsibleEngineer?.name || row.engineer || 'Unassigned';
        return (
          <span className={`block max-w-[160px] truncate ${value === 'Unassigned' ? 'text-slate-400' : ''}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'overallStatus',
      label: 'Status',
      render: (row) => <ProjectStatusBadge value={row.overallStatus} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      hideOnMobile: true,
      render: (row) => <Badge tone={row.priority === 'Critical' ? 'rose' : row.priority === 'High' ? 'amber' : row.priority === 'Low' ? 'green' : 'blue'}>{row.priority}</Badge>,
    },
    { key: 'currentStage', label: 'Stage' },
    { key: 'stageCompletion', label: 'Completion', hideOnMobile: true, render: (row) => `${row.stageCompletion}%` },
    { key: 'invoiceStatus', label: 'Billing', hideOnMobile: true },
    { key: 'remarksOrBlockers', label: 'Remarks / Blockers', hideOnMobile: true, render: (row) => <span className="block max-w-[220px] truncate">{row.remarksOrBlockers || row.remarks || row.blockers || '-'}</span> },
    { key: 'ceoMdReview', label: 'CEO/MD Review', hideOnMobile: true, render: (row) => <span className="whitespace-nowrap">{row.ceoMdReview || '-'}</span> },
    { key: 'estimatedCompletion', label: 'Est. %', hideOnMobile: true, render: (row) => <span className="whitespace-nowrap">{row.estimatedCompletion ? `${row.estimatedCompletion}%` : '-'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-[72px] whitespace-nowrap text-right',
      render: (row) => {
        const isOpen = openMenuId === row.id;
        const menuHeight = 156;
        return (
          <div className="relative inline-flex justify-end" ref={isOpen ? menuRef : null}>
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 rounded-[16px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.82)] px-0 text-[rgb(var(--muted))] shadow-sm ring-0 transition hover:border-[rgb(var(--line)/0.22)] hover:bg-[rgb(var(--panel-2)/0.72)] hover:text-[rgb(var(--text))] focus-visible:ring-2 focus-visible:ring-sky-400/70"
              onClick={(event) => {
                event.stopPropagation();
                if (openMenuId === row.id) {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                  return;
                }

                const rect = event.currentTarget.getBoundingClientRect();
                const estimatedLeft = rect.right - 46;
                const estimatedTop =
                  rect.bottom + menuHeight < window.innerHeight - 12
                    ? rect.bottom + 10
                    : Math.max(12, rect.top - menuHeight - 10);
                const clampedLeft = Math.min(Math.max(estimatedLeft, 8), window.innerWidth - 62);

                setMenuPosition({
                  top: estimatedTop,
                  left: clampedLeft,
                });
                setOpenMenuId(row.id);
              }}
              aria-label="Project actions"
              title="Project actions"
            >
              <MoreVertical className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        );
      },
    },
  ]), [navigate, onDelete, onEdit, openMenuId]);

  const columns = useMemo(() => {
    if (!compact) return baseColumns;

    return [
      baseColumns[0],
      baseColumns[4],
      baseColumns[5],
      baseColumns[6],
      baseColumns[7],
      baseColumns[8],
      baseColumns[11],
      baseColumns[12],
    ];
  }, [baseColumns, compact]);

  const visibleColumns = useMemo(() => {
    if (!showSelection) {
      return columns;
    }

    return [
      {
        key: 'select',
        label: '',
        className: 'w-12 whitespace-nowrap',
        render: (row) => (
          <button
            type="button"
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
              selectedIds.includes(row.id)
                ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                : 'border-[rgb(var(--line)/0.28)] bg-white text-transparent hover:border-sky-300 hover:bg-sky-50'
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleRowSelection?.(row.id);
            }}
            aria-label={`Select ${row.projectName}`}
            aria-pressed={selectedIds.includes(row.id)}
            title={`Select ${row.projectName}`}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        ),
      },
      ...columns,
    ];
  }, [columns, onToggleRowSelection, selectedIds, showSelection]);

  return (
    <>
      <DataTable
        columns={visibleColumns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage="No projects found."
        scrollClassName={`scrollbar-none max-h-[calc(100vh-25rem)] !overflow-y-auto overflow-x-auto pr-1 ${compact ? 'overflow-x-hidden' : ''}`}
        stickyHeader
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
                    {onEdit ? (
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[rgb(var(--text))] transition hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          onEdit(row);
                        }}
                        aria-label="Edit project"
                        title="Edit"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <PencilLine className="h-4 w-4" />
                        </span>
                        <span className="sr-only">Edit</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[rgb(var(--text))] transition hover:bg-slate-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(null);
                        setMenuPosition(null);
                        navigate(`/projects/${row.id}`);
                      }}
                      aria-label="View project"
                      title="View"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Eye className="h-4 w-4" />
                      </span>
                      <span className="sr-only">View</span>
                    </button>
                    {onDelete ? (
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-500/10"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          onDelete(row);
                        }}
                        aria-label="Delete project"
                        title="Delete"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </span>
                        <span className="sr-only">Delete</span>
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
