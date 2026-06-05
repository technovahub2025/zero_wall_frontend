import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  CirclePlus,
  Edit3,
  Layers3,
  MapPinned,
  MoreVertical,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { ModalShell } from '../components/shared/ModalShell';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import {
  useCreateStageGuide,
  useDeleteStageGuide,
  useStageGuide,
  useUpdateStageGuide,
} from '../hooks/useStageGuide';

const emptyForm = {
  stageNo: '',
  stageName: '',
  stageDescription: '',
  keyDeliverables: '',
  approvalRequired: '',
  disciplines: '',
  duration: '',
  sequenceOrder: 0,
  isActive: true,
};

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export default function StageGuidePage() {
  const user = useAuthStore((state) => state.user);
  const openConfirm = useUiStore((state) => state.openConfirm);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);
  const stageGuideQuery = useStageGuide();
  const createStageGuide = useCreateStageGuide();
  const updateStageGuide = useUpdateStageGuide();
  const deleteStageGuide = useDeleteStageGuide();

  const role = normalizeRole(user?.role);
  const canManage = ['superadmin', 'admin', 'project_manager'].includes(role);
  const canDelete = ['superadmin', 'admin'].includes(role);

  useEffect(() => {
    if (!editor) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setEditor(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor]);

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

  const rows = useMemo(() => {
    const list = stageGuideQuery.data || [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((row) =>
      [row.stageNo, row.stageName, row.approvalRequired, row.disciplines, row.duration, row.stageDescription, row.keyDeliverables]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, stageGuideQuery.data]);

  const counts = useMemo(() => ({
    total: stageGuideQuery.data?.length || 0,
    active: (stageGuideQuery.data || []).filter((row) => row.isActive !== false).length,
    approval: (stageGuideQuery.data || []).filter((row) => String(row.approvalRequired || '').toLowerCase().includes('yes')).length,
  }), [stageGuideQuery.data]);

  function openCreate() {
    setEditor({ mode: 'create', data: { ...emptyForm } });
  }

  function openEdit(row) {
    setEditor({
      mode: 'edit',
      data: {
        stageNo: row.stageNo || '',
        stageName: row.stageName || '',
        stageDescription: row.stageDescription || '',
        keyDeliverables: row.keyDeliverables || '',
        approvalRequired: row.approvalRequired || '',
        disciplines: row.disciplines || '',
        duration: row.duration || '',
        sequenceOrder: row.sequenceOrder || 0,
        isActive: row.isActive !== false,
      },
      id: row.id,
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      stageNo: String(formData.get('stageNo') || '').trim(),
      stageName: String(formData.get('stageName') || '').trim(),
      stageDescription: String(formData.get('stageDescription') || '').trim(),
      keyDeliverables: String(formData.get('keyDeliverables') || '').trim(),
      approvalRequired: String(formData.get('approvalRequired') || '').trim(),
      disciplines: String(formData.get('disciplines') || '').trim(),
      duration: String(formData.get('duration') || '').trim(),
      sequenceOrder: Number(formData.get('sequenceOrder') || 0),
      isActive: formData.get('isActive') === 'on',
    };

    if (editor?.mode === 'edit') {
      await updateStageGuide.mutateAsync({ id: editor.id, payload });
    } else {
      await createStageGuide.mutateAsync(payload);
    }
    setEditor(null);
  }

  function handleDelete(row) {
    openConfirm({
      title: 'Delete stage guide row',
      message: `Delete ${row.stageNo} - ${row.stageName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteStageGuide.mutateAsync(row.id);
      },
    });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Reference</p>
            <h1 className="hero-title flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-sky-500" />
              Stage Guide
            </h1>
            <p className="hero-subtitle">
              Manage the master stage guide used across project planning, approvals, and delivery tracking.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/50 px-4 py-3 text-sm text-slate-600 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <Layers3 className="h-3.5 w-3.5" />
                <span>Stages</span>
              </div>
              <div className="mt-1 font-semibold text-slate-900">{counts.total} reference rows</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/50 px-4 py-3 text-sm text-slate-600 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Approvals</span>
              </div>
              <div className="mt-1 font-semibold text-slate-900">{counts.approval} client-gated stages</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/50 px-4 py-3 text-sm text-slate-600 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                <span>Usage</span>
              </div>
              <div className="mt-1 font-semibold text-slate-900">{counts.active} active entries</div>
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="input flex w-full items-center gap-2 rounded-2xl px-4 py-3 lg:max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stage number, name, approval, discipline..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
            {canManage ? (
              <Button onClick={openCreate} className="shrink-0">
                <CirclePlus className="h-4 w-4" />
                Add Stage Guide
              </Button>
            ) : null}
          </div>

          {stageGuideQuery.isLoading ? (
            <SkeletonCard />
          ) : stageGuideQuery.isError ? (
            <EmptyState
              title="Failed to load stage guide"
              description={stageGuideQuery.error?.message || 'Try refreshing the page.'}
              action={
                <Button variant="secondary" onClick={() => stageGuideQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : rows.length ? (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/60">
              <div className="max-h-[68vh] overflow-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-[rgb(var(--panel)/0.98)] backdrop-blur">
                    <tr className="text-left text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      <th className="px-5 py-4">Stage</th>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Approval</th>
                      <th className="px-5 py-4">Disciplines</th>
                      <th className="px-5 py-4">Duration</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-white/5 text-sm text-[rgb(var(--text))]">
                        <td className="px-5 py-4 align-top font-medium whitespace-nowrap">{row.stageNo}</td>
                        <td className="px-5 py-4 align-top">{row.stageName}</td>
                        <td className="px-5 py-4 align-top text-slate-500">{row.approvalRequired || '-'}</td>
                        <td className="px-5 py-4 align-top text-slate-500">{row.disciplines || '-'}</td>
                        <td className="px-5 py-4 align-top whitespace-nowrap text-slate-500">{row.duration || '-'}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            {canManage || canDelete ? (
                              <div className="relative inline-flex justify-end" ref={openMenuId === row.id ? menuRef : null}>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-10 w-10 rounded-xl border border-[rgb(var(--line)/0.18)] bg-white/95 px-0 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (openMenuId === row.id) {
                                      setOpenMenuId(null);
                                      setMenuPosition(null);
                                      return;
                                    }

                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const menuHeight = canDelete ? 108 : 56;
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
                                  aria-label="Stage guide actions"
                                  title="Stage guide actions"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No stage guide rows"
              description="Add the first stage guide row to start building the reference list."
              action={
                canManage ? (
                  <Button onClick={openCreate}>
                    <CirclePlus className="h-4 w-4" />
                    Add Stage Guide
                  </Button>
                ) : null
              }
            />
          )}
        </CardBody>
      </Card>

      {editor ? (
        <ModalShell
          title={editor.mode === 'edit' ? 'Edit Stage Guide' : 'Add Stage Guide'}
          description="Maintain the stage reference used throughout project planning."
          onClose={() => setEditor(null)}
          widthClassName="max-w-4xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stage No">
                <input className="input" name="stageNo" defaultValue={editor.data.stageNo} />
              </Field>
              <Field label="Stage Name">
                <input className="input" name="stageName" defaultValue={editor.data.stageName} />
              </Field>
              <Field label="Approval Required" className="sm:col-span-2">
                <input className="input" name="approvalRequired" defaultValue={editor.data.approvalRequired} />
              </Field>
              <Field label="Disciplines" className="sm:col-span-2">
                <input className="input" name="disciplines" defaultValue={editor.data.disciplines} />
              </Field>
              <Field label="Duration">
                <input className="input" name="duration" defaultValue={editor.data.duration} />
              </Field>
              <Field label="Sequence Order">
                <input className="input" name="sequenceOrder" type="number" min="0" defaultValue={editor.data.sequenceOrder} />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className="input min-h-[96px]" name="stageDescription" defaultValue={editor.data.stageDescription} />
              </Field>
              <Field label="Key Deliverables" className="sm:col-span-2">
                <textarea className="input min-h-[96px]" name="keyDeliverables" defaultValue={editor.data.keyDeliverables} />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 text-sm text-[rgb(var(--text))] sm:col-span-2">
                <input type="checkbox" name="isActive" defaultChecked={editor.data.isActive} className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
                <span>Active</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStageGuide.isPending || updateStageGuide.isPending}>
                {editor.mode === 'edit' ? 'Save Changes' : 'Create Row'}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

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
                    {canManage ? (
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[rgb(var(--text))] transition hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          openEdit(row);
                        }}
                        aria-label="Edit stage guide"
                        title="Edit"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Edit3 className="h-4 w-4" />
                        </span>
                        <span className="sr-only">Edit</span>
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-500/10"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          handleDelete(row);
                        }}
                        aria-label="Delete stage guide"
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
    </motion.div>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      {children}
    </label>
  );
}
