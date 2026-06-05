import { useDeferredValue, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { ClientTable } from '../components/clients/ClientTable';
import { ClientForm } from '../components/clients/ClientForm';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { ModalShell } from '../components/shared/ModalShell';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { Card, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useUiStore } from '../store/uiStore';
import { useDebouncedValue } from '../utils/performance';
import { canDo } from '../utils/roleUtils';

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Lead', value: 'Lead' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Archived', value: 'Archived' },
];

const segmentOptions = [
  { label: 'All Segments', value: 'all' },
  { label: 'Residential', value: 'Residential' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Manufacturing', value: 'Manufacturing' },
];

export default function Clients() {
  const user = useAuthStore((state) => state.user);
  const clientsQuery = useClients();
  const projectsQuery = useProjects();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { activeModal, modalData, openModal, closeModal, openConfirm } = useUiStore();
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [segment, setSegment] = useState('all');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const projects = projectsQuery.data || [];
  const canManage = canDo(user?.role, 'createClient');
  const canDelete = canDo(user?.role, 'deleteClient');

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return (clientsQuery.data || []).filter((client) => {
      const matchesSearch =
        !q ||
        [client.clientName, client.companyName, client.contactPerson, client.email, client.phone, client.city]
          .join(' ')
          .toLowerCase()
          .includes(q);
      const matchesStatus = status === 'all' || client.status === status;
      const matchesSegment = segment === 'all' || client.segment === segment;
      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [clientsQuery.data, deferredSearch, segment, status]);

  async function handleSave(values) {
    if (modalData?.id) {
      await updateClient.mutateAsync({ id: modalData.id, payload: values });
    } else {
      await createClient.mutateAsync(values);
    }
    closeModal();
  }

  function handleDelete(client) {
    openConfirm({
      title: 'Delete client',
      message: `Delete ${client.clientName}?`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: () => deleteClient.mutateAsync(client.id),
    });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Clients</p>
            <h1 className="hero-title">Client master</h1>
            <p className="hero-subtitle max-w-3xl">Track client records and link their projects in one live CRUD surface.</p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openModal('client', null)}>Add Client</Button>
            </div>
          ) : null}
        </div>
      </section>

      <Card>
        <CardBody className="space-y-4">
          {clientsQuery.isError ? (
            <Card>
              <CardBody className="flex items-center gap-3 py-10">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">{clientsQuery.error?.message || 'Failed to load clients'}</div>
                  <div className="text-xs text-slate-500">Try again once the API is reachable.</div>
                </div>
                <Button variant="secondary" onClick={() => clientsQuery.refetch()}>Retry</Button>
              </CardBody>
            </Card>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <SearchInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search clients..." />
            <FilterChips options={statusOptions} value={status} onChange={setStatus} />
            <FilterChips options={segmentOptions} value={segment} onChange={setSegment} />
          </div>

          {clientsQuery.isLoading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : filtered.length ? (
            <ClientTable
              rows={filtered}
              onEdit={canManage ? (client) => openModal('client', client) : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ) : (
            <EmptyState title="No clients found" description="Adjust the search or filter selection." />
          )}
        </CardBody>
      </Card>

      {activeModal === 'client' ? (
        <ModalShell
          title={modalData?.id ? 'Edit Client' : 'Add Client'}
          description="Create or update a client record."
          onClose={closeModal}
          widthClassName="max-w-5xl"
        >
          <ClientForm initialValues={modalData} projects={projects} onSubmit={handleSave} onCancel={closeModal} />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}
