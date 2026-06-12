import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgePercent, Hash, IndianRupee, LayoutGrid, MoreVertical, PencilLine, ReceiptText, Trash2, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../shared/DataTable';
import { VirtualList } from '../shared/VirtualList';
import { BillingProgressBar } from './BillingProgressBar';
import { cn } from '../../lib/utils';

const VIRTUALIZE_THRESHOLD = 24;
const GRID_TEMPLATE = 'minmax(15rem, 1.9fr) minmax(8rem, 0.75fr) minmax(10rem, 1fr) minmax(8rem, 0.85fr) minmax(8rem, 0.85fr) minmax(8rem, 0.85fr) minmax(11rem, 1.2fr) 88px';
const moneyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return `Rs. ${moneyFormatter.format(Number(value || 0))}L`;
}

function statusTone(status = '') {
  const value = String(status).toLowerCase();
  if (value.includes('paid') || value.includes('received') || value.includes('collected')) return 'green';
  if (value.includes('overdue') || value.includes('pending')) return 'amber';
  if (value.includes('draft') || value.includes('submitted')) return 'blue';
  return 'blue';
}

function normalizeRow(row = {}) {
  const amountTotal = Number(row.amountTotal || 0);
  const amountReceived = Number(row.amountReceived || 0);
  const balance = Number(row.balance ?? Math.max(0, amountTotal - amountReceived));
  const billingStatus = row.billingStatus || row.status || 'Pending';

  return {
    ...row,
    amountTotal,
    amountReceived,
    balance,
    billingStatus,
    invoiceNo: row.invoiceNo || '-',
    projectName: row.project?.projectName || row.projectName || '-',
    clientName: row.project?.clientName || row.clientName || '-',
    progress: amountTotal > 0 ? Math.round((amountReceived / amountTotal) * 100) : 0,
  };
}

function InvoiceActionsMenu({ row, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const items = useMemo(
    () =>
      [
        onEdit
          ? {
              key: 'edit',
              label: 'Edit',
              icon: PencilLine,
              tone: 'default',
              action: () => onEdit(row),
            }
          : null,
        onDelete
          ? {
              key: 'delete',
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              action: () => onDelete(row),
            }
          : null,
      ].filter(Boolean),
    [onDelete, onEdit, row],
  );

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (triggerRef.current?.contains?.(event.target)) return;
      if (menuRef.current?.contains?.(event.target)) return;
      setOpen(false);
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    function handleScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (open && position) {
      setMounted(true);
    }
  }, [open, position]);

  function openMenu(event) {
    event.stopPropagation();

    if (open) {
      setOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect?.();
    if (!rect) return;

    const width = 184;
    const height = items.length * 44 + 12;
    const top = rect.bottom + height < window.innerHeight - 12 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
    const left = Math.min(Math.max(rect.right - width, 8), window.innerWidth - width - 8);

    setPosition({ top, left, width });
    setOpen(true);
  }

  if (!items.length) return null;

  return (
    <div className="relative inline-flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.18)] bg-white/95 text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        aria-label="Open invoice actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Open invoice actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {mounted && position && typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence
              onExitComplete={() => {
                if (!open) setMounted(false);
              }}
            >
              {open ? (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                  className="fixed z-[120] overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] p-2 shadow-2xl shadow-slate-900/12 backdrop-blur-xl"
                  style={{ top: position.top, left: position.left, width: position.width }}
                  role="menu"
                >
                  <div className="grid gap-1">
                    {items.map(({ key, label, icon: Icon, tone, action }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpen(false);
                          action();
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200',
                          tone === 'danger' ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                        )}
                        role="menuitem"
                      >
                        <span
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-lg',
                            tone === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

function BillingVirtualRows({ rows = [], onEdit, onDelete }) {
  return (
    <div className="overflow-hidden">
      <div
        className="grid border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur-xl"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Project</span>
        <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Invoice No</span>
        <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-3.5 w-3.5" />Status</span>
        <span className="inline-flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5" />Total</span>
        <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Received</span>
        <span className="inline-flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5" />Balance</span>
        <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Progress</span>
        <span className="inline-flex items-center justify-end gap-1.5 text-right"><ReceiptText className="h-3.5 w-3.5" />Actions</span>
      </div>

      <VirtualList
        items={rows}
        estimateSize={92}
        className="scrollbar-none h-[68vh] max-h-[68vh] overscroll-contain"
        renderItem={(row) => (
          <motion.div
            className="px-2 py-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div
              className="grid items-center gap-3 rounded-3xl border border-[rgb(var(--line)/0.08)] bg-white/92 px-4 py-4 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-38px_rgba(15,23,42,0.48)]"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
                <div className="truncate text-xs text-slate-400">{row.clientName}</div>
              </div>
              <div className="whitespace-nowrap text-slate-400">{row.invoiceNo}</div>
              <div>
                <Badge tone={statusTone(row.billingStatus)}>{row.billingStatus}</Badge>
              </div>
              <div className="whitespace-nowrap text-slate-300">{formatMoney(row.amountTotal)}</div>
              <div className="whitespace-nowrap text-emerald-300">{formatMoney(row.amountReceived)}</div>
              <div className="whitespace-nowrap text-amber-300">{formatMoney(row.balance)}</div>
              <div className="min-w-0">
                <BillingProgressBar received={row.amountReceived} total={row.amountTotal} />
              </div>
              <div className="flex justify-end">
                <InvoiceActionsMenu row={row} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </motion.div>
        )}
      />
    </div>
  );
}

export function BillingTable({ rows = [], onEdit, onDelete, onCreate }) {
  const normalizedRows = useMemo(() => rows.map(normalizeRow), [rows]);
  const shouldVirtualize = normalizedRows.length > VIRTUALIZE_THRESHOLD;

  const columns = useMemo(
    () => [
      {
        key: 'project',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Project
          </span>
        ),
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
            <div className="truncate text-xs text-slate-400">{row.clientName}</div>
          </div>
        ),
      },
      {
        key: 'invoiceNo',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            Invoice No
          </span>
        ),
        render: (row) => <span className="whitespace-nowrap text-slate-400">{row.invoiceNo}</span>,
      },
      {
        key: 'billingStatus',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <BadgePercent className="h-3.5 w-3.5" />
            Status
          </span>
        ),
        render: (row) => <Badge tone={statusTone(row.billingStatus)}>{row.billingStatus}</Badge>,
      },
      {
        key: 'amountTotal',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" />
            Total
          </span>
        ),
        render: (row) => <span className="whitespace-nowrap text-slate-300">{formatMoney(row.amountTotal)}</span>,
      },
      {
        key: 'amountReceived',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Received
          </span>
        ),
        render: (row) => <span className="whitespace-nowrap text-emerald-300">{formatMoney(row.amountReceived)}</span>,
      },
      {
        key: 'balance',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" />
            Balance
          </span>
        ),
        render: (row) => <span className="whitespace-nowrap text-amber-300">{formatMoney(row.balance)}</span>,
      },
      {
        key: 'progress',
        label: (
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Progress
          </span>
        ),
        render: (row) => <BillingProgressBar received={row.amountReceived} total={row.amountTotal} />,
      },
      {
        key: 'actions',
        label: (
          <span className="inline-flex items-center justify-end gap-1.5">
            <ReceiptText className="h-3.5 w-3.5" />
            Actions
          </span>
        ),
        className: 'w-[88px] whitespace-nowrap text-right',
        render: (row) => (
          <div className="flex justify-end">
            <InvoiceActionsMenu row={row} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <Card className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-white/92 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
      <CardHeader className="items-center justify-between bg-gradient-to-r from-white/96 via-white/90 to-sky-50/60">
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/10">
              <ReceiptText className="h-4 w-4" />
            </span>
            Billing
          </CardTitle>
          <div className="mt-1 text-xs text-slate-500">Invoices are shown in a scrollable, performance-tuned workspace.</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onCreate ? (
            <Button size="sm" onClick={onCreate} className="shadow-[0_12px_28px_-18px_rgba(14,165,233,0.85)] transition duration-200 hover:-translate-y-0.5">
              Add Invoice
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {shouldVirtualize ? (
          <BillingVirtualRows rows={normalizedRows} onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <DataTable
            columns={columns}
            rows={normalizedRows}
            rowKey={(row) => row.id}
            emptyMessage="No invoices yet."
            scrollClassName="scrollbar-none max-h-[68vh] overscroll-contain pr-1"
            stickyHeader
            scrollAxis="y"
            rowClassName="group transition-all duration-300 hover:bg-[rgb(var(--panel-2)/0.72)]"
          />
        )}
      </CardBody>
    </Card>
  );
}
