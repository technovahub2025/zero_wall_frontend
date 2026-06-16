import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, PencilLine, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DataTable } from '../shared/DataTable';

export function ClientTable({ rows = [], onEdit, onDelete, onRowClick, selectedId }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns = useMemo(() => ([
    {
      key: 'clientName',
      label: 'Client',
      render: (row) => (
        <div>
          <div className="font-semibold text-[rgb(var(--text))]">{row.clientName}</div>
          <div className="text-xs text-[rgb(var(--muted))]">{row.companyName || row.contactPerson || '-'}</div>
        </div>
      ),
    },
    { key: 'segment', label: 'Segment', render: (row) => <span>{row.segment || '-'}</span> },
    { key: 'city', label: 'City', hideOnMobile: true, render: (row) => <span>{row.city || '-'}</span> },
    { key: 'contactPerson', label: 'Contact', hideOnMobile: true, render: (row) => <span className="block max-w-[180px] truncate">{row.contactPerson || '-'}</span> },
    { key: 'email', label: 'Email', hideOnMobile: true, render: (row) => <span className="block max-w-[200px] truncate">{row.email || '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Active' ? 'green' : row.status === 'Lead' ? 'blue' : row.status === 'Inactive' ? 'amber' : 'slate'}>{row.status || 'Active'}</Badge>,
    },
    { key: 'projectCount', label: 'Projects', render: (row) => <span>{row.projectCount || 0}</span> },
    { key: 'notes', label: 'Notes', hideOnMobile: true, render: (row) => <span className="block max-w-[220px] truncate">{row.notes || '-'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-[96px] whitespace-nowrap text-right',
      render: (row) => {
        const isOpen = openMenuId === row.id;
        return (
          <div className="relative inline-flex justify-end" ref={isOpen ? menuRef : null}>
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 rounded-full px-0 shadow-sm"
              onClick={(event) => {
                event.stopPropagation();
                setOpenMenuId((current) => (current === row.id ? null : row.id));
              }}
              aria-label="Client actions"
              title="Client actions"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {isOpen ? (
              <div className="absolute right-0 top-12 z-20 min-w-36 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.98)] p-2 shadow-2xl backdrop-blur">
                {onEdit ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.82)]"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(null);
                      onEdit(row);
                    }}
                  >
                    <PencilLine className="h-4 w-4 text-[rgb(var(--muted))]" />
                    Edit
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(null);
                      onDelete(row);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      },
    },
  ]), [onDelete, onEdit, openMenuId]);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage="No clients found."
      scrollClassName="max-h-[calc(100vh-25rem)] pb-3 pr-1"
      tableClassName="min-w-[980px]"
      stickyHeader
      scrollAxis="both"
      onRowClick={onRowClick}
      rowClassName={(row) => (selectedId && String(row.id) === String(selectedId) ? 'bg-sky-500/10' : '')}
    />
  );
}
