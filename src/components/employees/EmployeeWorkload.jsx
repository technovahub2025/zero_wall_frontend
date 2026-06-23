import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, FolderKanban, Gauge, Layers3, ListTodo, PencilLine, Trash2, TrendingUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { RadialProgress } from '../shared/RadialProgress';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { KanbanActionsMenu } from '../kanban/KanbanActionsMenu';
import { ModalShell } from '../shared/ModalShell';
import { ProjectForm } from '../projects/ProjectForm';
import { useUpdateProject, useDeleteProject } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const WORKLOAD_BASELINE_HOURS = 40;

export function EmployeeWorkload({ data, employeeId = '' }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeesQuery = useEmployees();
  const employees = employeesQuery.data || [];
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const openConfirm = useUiStore((state) => state.openConfirm);
  const userRole = useAuthStore((state) => state.user?.role);
  const canDelete = userRole === 'superadmin';
  const [editingProject, setEditingProject] = useState(null);
  const { rows, totalHours, totalTasks, loadPct, activeProjects, idleProjects, averagePerProject, topProject } = useMemo(() => {
    const normalizedRows = (data?.projects || [])
      .map((row) => ({
        ...row,
        hours: Number(row.hours || 0),
        taskCount: Number(row.taskCount || 0),
      }))
      .sort((a, b) => b.hours - a.hours || b.taskCount - a.taskCount || String(a.projectName).localeCompare(String(b.projectName)));

    const hours = Number(data?.totalHours || 0);
    const tasks = Number(data?.tasks || 0);
    const load = Math.max(0, Math.min(100, Math.round((hours / WORKLOAD_BASELINE_HOURS) * 100)));
    const active = normalizedRows.filter((row) => row.hours > 0 || row.taskCount > 0).length;
    const idle = normalizedRows.length - active;
    const average = normalizedRows.length ? hours / normalizedRows.length : 0;
    const top = normalizedRows[0] || null;

    return {
      rows: normalizedRows,
      totalHours: hours,
      totalTasks: tasks,
      loadPct: load,
      activeProjects: active,
      idleProjects: idle,
      averagePerProject: average,
      topProject: top,
    };
  }, [data]);

  async function handleSaveProject(values) {
    if (!editingProject) return;
    await updateProject.mutateAsync({ id: editingProject.id, payload: values });
    await queryClient.invalidateQueries({ queryKey: ['employee-workload', employeeId] });
    await queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    setEditingProject(null);
  }

  function handleDeleteProject(project) {
    openConfirm({
      title: 'Delete project',
      message: `Delete ${project.projectName}? This removes the project and related data.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteProject.mutateAsync(project.id);
        await queryClient.invalidateQueries({ queryKey: ['employee-workload', employeeId] });
        await queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gauge className="h-4 w-4 text-sky-500" />
              Workload Summary
            </CardTitle>
            <p className="text-xs text-slate-500">Current workload and project allocation across all linked projects.</p>
          </div>
          <Badge tone={loadPct >= 85 ? 'rose' : loadPct >= 65 ? 'amber' : 'green'}>
            {loadPct}% load
          </Badge>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total hours" value={totalHours.toFixed(1)} helper="Logged time" icon={Clock3} tone="blue" />
            <Metric label="Projects" value={rows.length} helper="Allocated projects" icon={FolderKanban} tone="amber" />
            <Metric label="Tasks" value={totalTasks} helper="Assigned tasks" icon={ListTodo} tone="green" />
            <Metric label="Average" value={`${averagePerProject.toFixed(1)}h`} helper="Per project" icon={TrendingUp} tone="rose" />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-3xl border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Capacity</div>
                  <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">Baseline: {WORKLOAD_BASELINE_HOURS}h / week</div>
                </div>
                <Badge tone={loadPct >= 85 ? 'rose' : loadPct >= 65 ? 'amber' : 'blue'}>
                  {loadPct >= 85 ? 'Overloaded' : loadPct >= 65 ? 'Busy' : 'Balanced'}
                </Badge>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width]',
                    loadPct >= 85 ? 'bg-rose-500' : loadPct >= 65 ? 'bg-amber-500' : 'bg-sky-500',
                  )}
                  style={{ width: `${loadPct}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Detail label="Active projects" value={activeProjects} />
                <Detail label="Idle projects" value={idleProjects} valueTone={idleProjects > 0 ? 'text-slate-900' : 'text-emerald-600'} />
                <Detail label="Peak project" value={topProject ? `${topProject.hours.toFixed(1)}h` : '0h'} />
              </div>
            </div>

            <div className="flex items-center justify-center rounded-3xl border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm">
              <RadialProgress
                value={loadPct}
                size={160}
                label="Load"
                color={loadPct >= 85 ? '#F43F5E' : loadPct >= 65 ? '#F59E0B' : '#2E83F5'}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-sky-500" />
              Project Allocation
            </CardTitle>
            <p className="text-xs text-slate-500">Sorted by logged hours, with task counts and relative share.</p>
          </div>
          <Badge tone="slate">{rows.length} items</Badge>
        </CardHeader>

        <CardBody className="space-y-4">
          {topProject ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600">Top allocation</div>
                  <div className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{topProject.projectName}</div>
                  <div className="text-sm text-slate-500">{topProject.clientName || 'Client not set'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{topProject.hours.toFixed(1)}h</Badge>
                  <Badge tone={topProject.taskCount > 0 ? 'green' : 'slate'}>{topProject.taskCount || 0} tasks</Badge>
                </div>
              </div>
            </div>
          ) : null}

          <div className="scrollbar-none max-h-[calc(100vh-38rem)] space-y-3 overflow-y-auto pr-1">
            {rows.length ? (
              rows.map((row) => {
                const share = totalHours > 0 ? Math.round((row.hours / totalHours) * 100) : 0;
                const filled = totalHours > 0 ? (row.hours / totalHours) * 100 : 0;
                return (
                  <div key={row.id} className="rounded-3xl border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{row.clientName || 'Client not set'}</div>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-[rgb(var(--text))]">{row.hours.toFixed(1)}h</div>
                          <div className="text-xs text-slate-500">{share}% of total load</div>
                        </div>
                        <KanbanActionsMenu
                          align="right"
                          triggerClassName="h-8 w-8 rounded-xl"
                          items={[
                            { key: 'open', label: 'Open project', icon: FolderKanban, onClick: () => navigate(`/projects/${row.id}`) },
                            { key: 'edit', label: 'Edit project', icon: PencilLine, onClick: () => setEditingProject(row) },
                            ...(canDelete ? [{ key: 'delete', label: 'Delete project', icon: Trash2, tone: 'danger', onClick: () => handleDeleteProject(row) }] : []),
                          ]}
                        />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width]',
                          row.hours > 0 ? 'bg-sky-500' : 'bg-slate-300',
                        )}
                        style={{ width: `${filled}%` }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge tone={row.hours > 0 ? 'green' : 'slate'}>{row.hours > 0 ? 'Active' : 'Idle'}</Badge>
                      <Badge tone="slate">{row.taskCount || 0} tasks</Badge>
                      <Badge tone="blue">{share}% share</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-[rgb(var(--line)/0.18)] bg-white/50 p-5 text-sm text-slate-500">
                No workload data available.
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {editingProject ? (
        <ModalShell
          title="Edit Project"
          description="Update the selected project allocation details."
          onClose={() => setEditingProject(null)}
        >
          <ProjectForm
            initialValues={editingProject}
            employees={employees}
            onCancel={() => setEditingProject(null)}
            onSubmit={handleSaveProject}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function Metric({ label, value, helper, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: 'bg-sky-500/10 text-sky-500 ring-sky-400/20',
    amber: 'bg-amber-500/10 text-amber-500 ring-amber-400/20',
    green: 'bg-emerald-500/10 text-emerald-500 ring-emerald-400/20',
    rose: 'bg-rose-500/10 text-rose-500 ring-rose-400/20',
  };

  return (
    <div className="rounded-3xl border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ring-1 ${toneMap[tone] || toneMap.blue}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-[rgb(var(--text))]">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{helper}</div>
    </div>
  );
}

function Detail({ label, value, valueTone = 'text-[rgb(var(--text))]' }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/70 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className={cn('mt-2 text-xl font-semibold', valueTone)}>{value}</div>
    </div>
  );
}
