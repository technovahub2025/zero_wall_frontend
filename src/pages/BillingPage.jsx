import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, FilePlus2, ReceiptText, Sparkles } from 'lucide-react';
import { pageVariants, staggerItem } from '../utils/motionVariants';
import { useProjects } from '../hooks/useProjects';
import { useBilling, useBillingSummary, useCreateInvoice, useDeleteInvoice, useUpdateInvoice } from '../hooks/useBilling';
import { BillingKPIRow } from '../components/billing/BillingKPIRow';
import { BillingForm } from '../components/billing/BillingForm';
import { BillingTable } from '../components/billing/BillingTable';
import { ModalShell } from '../components/shared/ModalShell';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';

export default function BillingPage() {
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const projectsQuery = useProjects();
  const invoicesQuery = useBilling();
  const summaryQuery = useBillingSummary();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const userRole = useAuthStore((state) => state.user?.role);
  const canDelete = userRole === 'superadmin';

  const invoices = useMemo(() => invoicesQuery.data || [], [invoicesQuery.data]);
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);
  const summary = summaryQuery.data || {};

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const rows = useMemo(
    () =>
      invoices.map((row) => ({
        ...row,
        project: row.project || projectsById.get(row.project?.id || row.projectId),
      })),
    [invoices, projectsById],
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-10">
      <motion.section variants={staggerItem} className="theme-hero theme-hero-amber overflow-hidden p-5 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.4)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600 shadow-sm">
              <ReceiptText className="h-3.5 w-3.5" />
              Billing
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h1 className="hero-title">Revenue and billing overview</h1>
            <p className="hero-subtitle max-w-3xl">Live invoices, outstanding balances, and billing progress in one workspace designed for fast review.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <ArrowRight className="h-3.5 w-3.5 text-sky-500" />
                Track collections
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <ReceiptText className="h-3.5 w-3.5 text-emerald-500" />
                Review invoices
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Clear actions
              </span>
            </div>
          </div>
          <Button onClick={() => { setEditingInvoice(null); setFormOpen(true); }}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </motion.section>

      {projectsQuery.isError || invoicesQuery.isError || summaryQuery.isError ? (
        <motion.div variants={staggerItem}>
          <Card className="border border-[rgb(var(--line)/0.12)] shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
            <CardBody className="flex items-center gap-3 py-10">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[rgb(var(--text))]">
                  {projectsQuery.error?.message || invoicesQuery.error?.message || summaryQuery.error?.message || 'Failed to load billing data'}
                </div>
                <div className="text-xs text-slate-500">Retry once the API is available.</div>
              </div>
              <Button variant="secondary" onClick={() => { projectsQuery.refetch(); invoicesQuery.refetch(); summaryQuery.refetch(); }}>Retry</Button>
            </CardBody>
          </Card>
        </motion.div>
      ) : null}

      <motion.div variants={staggerItem}>
        {summaryQuery.isLoading ? <SkeletonCard /> : <BillingKPIRow summary={summary} />}
      </motion.div>

      <motion.div variants={staggerItem}>
        {projectsQuery.isLoading || invoicesQuery.isLoading ? (
          <SkeletonCard />
        ) : rows.length ? (
          <BillingTable
            rows={rows}
            onCreate={() => {
              setEditingInvoice(null);
              setFormOpen(true);
            }}
            onEdit={(row) => {
              setEditingInvoice(row);
              setFormOpen(true);
            }}
            onDelete={canDelete ? ((row) => deleteInvoice.mutate(row.id)) : undefined}
          />
        ) : (
          <EmptyState title="No invoices yet" description="Create the first project invoice to start billing." action={<Button onClick={() => setFormOpen(true)}>Create Invoice</Button>} />
        )}
      </motion.div>

      {formOpen ? (
        <ModalShell
          title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
          description="Create or update project billing details."
          onClose={() => setFormOpen(false)}
          widthClassName="max-w-4xl"
        >
          <BillingForm
            initialValues={editingInvoice}
            projects={projects}
            onCancel={() => setFormOpen(false)}
            onSubmit={async (payload) => {
              if (editingInvoice) {
                await updateInvoice.mutateAsync({ id: editingInvoice.id, payload });
              } else {
                await createInvoice.mutateAsync(payload);
              }
              setFormOpen(false);
              setEditingInvoice(null);
            }}
          />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}
