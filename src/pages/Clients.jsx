import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ExternalLink,
  FolderKanban,
  Globe2,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useClient } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { ClientTable } from '../components/clients/ClientTable';
import { ClientForm } from '../components/clients/ClientForm';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { ModalShell } from '../components/shared/ModalShell';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

const statusTone = {
  Active: 'green',
  Lead: 'blue',
  Inactive: 'amber',
  Archived: 'slate',
};

export default function Clients() {
  const navigate = useNavigate();
  const { id: selectedClientId } = useParams();
  const user = useAuthStore((state) => state.user);
  const clientsQuery = useClients();
  const canReadProjects = canDo(user?.role, 'viewAllProjects');
  const projectsQuery = useProjects({}, { enabled: canReadProjects });
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const saveLockRef = useRef(false);
  const { activeModal, modalData, openModal, closeModal, openConfirm } = useUiStore();
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [segment, setSegment] = useState('all');
  const debouncedSearch = useDebouncedValue(searchInput, 240);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const clients = clientsQuery.data || [];
  const projects = projectsQuery.data || [];
  const canManage = canDo(user?.role, 'createClient');
  const canDelete = canDo(user?.role, 'deleteClient');

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch =
        !q ||
        [client.clientName, client.companyName, client.contactPerson, client.email, client.phone, client.city, client.notes]
          .join(' ')
          .toLowerCase()
          .includes(q);
      const matchesStatus = status === 'all' || client.status === status;
      const matchesSegment = segment === 'all' || client.segment === segment;
      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [clients, deferredSearch, segment, status]);
  const hasActiveFilters = Boolean(deferredSearch.trim()) || status !== 'all' || segment !== 'all';

  const selectedClientQuery = useClient(selectedClientId, { enabled: Boolean(selectedClientId) });
  const selectedClient = selectedClientQuery.data || null;
  const previewClient = selectedClient || (!selectedClientId ? filtered[0] : null);

  const linkedProjects = useMemo(() => {
    if (!canReadProjects || !previewClient) return [];
    const projectIdSet = new Set((previewClient.projectIds || []).map((item) => String(item)));
    const clientNames = [previewClient.clientName, previewClient.companyName]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    return projects.filter((project) => {
      const projectId = String(project.id || project.dbId || '');
      const projectClient = String(project.clientName || project.client || '').trim().toLowerCase();
      return projectIdSet.has(projectId) || clientNames.includes(projectClient);
    });
  }, [canReadProjects, previewClient, projects]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.status === 'Active').length;
    const leads = clients.filter((client) => client.status === 'Lead').length;
    const linkedProjectsTotal = clients.reduce((sum, client) => sum + Number(client.projectCount || 0), 0);
    return [
      { label: 'Clients', value: total, tone: 'blue', note: `${filtered.length} currently in view` },
      { label: 'Active', value: active, tone: 'green', note: `${active ? 'Live records' : 'No active clients'}` },
      { label: 'Leads', value: leads, tone: 'amber', note: 'Pipeline opportunities' },
      { label: 'Projects', value: linkedProjectsTotal, tone: 'rose', note: 'Across the client base' },
    ];
  }, [clients, filtered.length]);

  async function handleSave(values) {
    if (saveLockRef.current) return;
    saveLockRef.current = true;
    try {
      if (modalData?.id) {
        await updateClient.mutateAsync({ id: modalData.id, payload: values });
      } else {
        await createClient.mutateAsync(values);
      }
      closeModal();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Could not save client');
    } finally {
      saveLockRef.current = false;
    }
  }

  function handleDelete(client) {
    openConfirm({
      title: 'Delete client',
      message: `Delete ${client.clientName}? This removes the record and detaches it from linked projects.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        try {
          await deleteClient.mutateAsync(client.id);
          if (String(selectedClientId) === String(client.id)) {
            navigate('/clients', { replace: true });
          }
        } catch (error) {
          toast.error(error?.response?.data?.message || error?.message || 'Could not delete client');
        }
      },
    });
  }

  function openClient(id) {
    navigate(`/clients/${id}`);
  }

  const loading = clientsQuery.isLoading || (Boolean(selectedClientId) && selectedClientQuery.isLoading);
  const detailError = Boolean(selectedClientId) && selectedClientQuery.isError;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,131,245,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,201,122,0.12),transparent_35%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
              <Sparkles className="h-3.5 w-3.5" />
              Client operations
            </div>
            <p className="hero-kicker">Clients</p>
            <h1 className="hero-title">Client master workspace</h1>
            <p className="hero-subtitle max-w-3xl">
              Manage client records, inspect linked projects, and keep pipeline status visible in one operating view.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live updates
            </div>
            {canManage ? (
              <Button onClick={() => openModal('client', null)}>
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--text))]">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500">{stat.note}</div>
              </div>
              <Badge tone={stat.tone}>{stat.label}</Badge>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card className="min-h-0">
          <CardHeader className="items-start justify-between">
            <div>
              <CardTitle>Client directory</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter, and open a client record to inspect its linked projects and metadata.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="slate">{filtered.length} shown</Badge>
              <Badge tone="blue">{clients.length} total</Badge>
            </div>
          </CardHeader>

          <CardBody className="space-y-4">
            {clientsQuery.isError ? (
              <Card>
                <CardBody className="flex items-center gap-3 py-8">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">
                      {clientsQuery.error?.message || 'Failed to load clients'}
                    </div>
                    <div className="text-xs text-slate-500">Retry after the API becomes available.</div>
                  </div>
                  <Button variant="secondary" onClick={() => clientsQuery.refetch()}>
                    Retry
                  </Button>
                </CardBody>
              </Card>
            ) : null}

            <div className="space-y-3">
              <SearchInput
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search clients, contacts, cities, notes..."
                className="min-w-0"
              />
              <div className="flex flex-wrap items-center gap-3">
                <FilterChips options={statusOptions} value={status} onChange={setStatus} />
                <FilterChips options={segmentOptions} value={segment} onChange={setSegment} />
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={6} columns={8} />
            ) : filtered.length ? (
              <ClientTable
                rows={filtered}
                onEdit={canManage ? (client) => openModal('client', client) : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                onRowClick={(client) => openClient(client.id)}
                selectedId={selectedClientId}
              />
            ) : (
              <EmptyState
                title="No clients found"
                description="Try a different search term or clear the filters."
                action={
                  canManage ? (
                    <Button onClick={() => openModal('client', null)}>
                      <Plus className="h-4 w-4" />
                      Add Client
                    </Button>
                  ) : null
                }
              />
            )}
          </CardBody>
        </Card>

        <Card className="min-h-0">
          <CardHeader className="items-start justify-between">
            <div>
              <CardTitle>Client details</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {previewClient
                  ? 'Operational summary for the selected client record.'
                  : 'Select a client from the list to inspect its profile.'}
              </p>
            </div>
            {selectedClientId ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
                <ArrowLeft className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </CardHeader>

          <CardBody className="space-y-4">
            {detailError ? (
              <Card>
                <CardBody className="flex items-center gap-3 py-8">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">
                      {selectedClientQuery.error?.response?.data?.message || 'Client not found'}
                    </div>
                    <div className="text-xs text-slate-500">The record may have been deleted or is unavailable.</div>
                  </div>
                </CardBody>
              </Card>
            ) : previewClient ? (
              <>
                <div className="rounded-3xl border border-[rgb(var(--line)/0.14)] bg-[linear-gradient(180deg,rgba(46,131,245,0.08),rgba(255,255,255,0.78))] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-semibold text-[rgb(var(--text))]">{previewClient.clientName}</h2>
                        <Badge tone={statusTone[previewClient.status] || 'slate'}>{previewClient.status || 'Active'}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {previewClient.companyName || 'Company not set'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Globe2 className="h-3.5 w-3.5" />
                          {previewClient.city || 'City not set'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FolderKanban className="h-3.5 w-3.5" />
                          {previewClient.projectCount || 0} projects
                        </span>
                      </div>
                    </div>
                    <Badge tone="blue">{previewClient.segment || 'Unsegmented'}</Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canManage ? (
                      <Button size="sm" variant="secondary" onClick={() => openModal('client', previewClient)}>
                        Edit Client
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(previewClient)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={Users} label="Contact Person" value={previewClient.contactPerson || '-'} />
                  <InfoTile icon={ShieldCheck} label="Email" value={previewClient.email || '-'} />
                  <InfoTile icon={LayoutGrid} label="Phone" value={previewClient.phone || '-'} />
                  <InfoTile icon={Building2} label="City" value={previewClient.city || '-'} />
                </div>

                <Card className="border border-[rgb(var(--line)/0.12)] bg-white/75">
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm leading-7 text-[rgb(var(--text))]">
                      {previewClient.notes || 'No notes recorded for this client yet.'}
                    </p>
                  </CardBody>
                </Card>

                <Card className="border border-[rgb(var(--line)/0.12)] bg-white/75">
                  <CardHeader className="justify-between">
                    <div>
                      <CardTitle>Linked projects</CardTitle>
                      <p className="mt-1 text-sm text-slate-500">Projects currently mapped to this client.</p>
                    </div>
                    <Badge tone="slate">{previewClient.projectCount || 0}</Badge>
                  </CardHeader>
                  <CardBody>
                    {canReadProjects ? (
                      linkedProjects.length ? (
                        <div className="space-y-2">
                          {linkedProjects.slice(0, 5).map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/80 px-3 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{project.projectName}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{project.currentStage || 'Stage not set'}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>{project.overallStatus || 'In Progress'}</span>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] px-4 py-6 text-sm text-slate-500">
                          No linked projects available.
                        </div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] px-4 py-6 text-sm text-slate-500">
                        Project visibility is restricted for this role.
                      </div>
                    )}
                  </CardBody>
                </Card>
              </>
            ) : (
              <EmptyState
                title="Select a client"
                description="Choose a row from the directory to inspect the client summary, linked projects, and record details."
                action={
                  hasActiveFilters ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchInput('');
                        setStatus('all');
                        setSegment('all');
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Clear filters
                    </Button>
                  ) : canManage ? (
                    <Button onClick={() => openModal('client', null)}>
                      <Plus className="h-4 w-4" />
                      Add Client
                    </Button>
                  ) : null
                }
              />
            )}
          </CardBody>
        </Card>
      </div>

      {activeModal === 'client' ? (
        <ModalShell
          title={modalData?.id ? 'Edit Client' : 'Add Client'}
          description="Create or update a client record."
          onClose={closeModal}
          widthClassName="max-w-5xl"
        >
          <ClientForm
            initialValues={modalData}
            projects={projects}
            onSubmit={handleSave}
            onCancel={closeModal}
            isSubmitting={createClient.isPending || updateClient.isPending}
          />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span>{label}</span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}
