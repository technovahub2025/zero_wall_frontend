import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Filter, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { createProject, fetchProjects } from '../api/dashboard';
import { exportProjectsToExcel } from '../lib/export';
import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { MiniProjectList, PriorityBadge, StatusBadge, TaskCountdownPill } from '../components/dashboard/Widgets';
import { ProjectDialog } from '../components/forms/ProjectDialog';

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
  const [query, setQuery] = useState('');
  const [view, setView] = useState('table');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (location.state?.openProjectDialog) {
      setOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Project created');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create project');
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((item) => {
      const matchesQuery =
        !q ||
        [item.name, item.client, item.location, item.stage, item.type, item.engineer, ...(item.tasks || []).map((task) => task.title), ...(item.tasks || []).map((task) => task.assignee)]
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesFilter = filter === 'all' || item.type.toLowerCase() === filter;

      return matchesQuery && matchesFilter;
    });
  }, [projects, query, filter]);

  function cycleFilter() {
    const order = ['all', 'residential', 'commercial', 'industrial', 'manufacturing'];
    const nextIndex = (order.indexOf(filter) + 1) % order.length;
    const nextFilter = order[nextIndex];
    setFilter(nextFilter);
    toast(`Filter: ${nextFilter === 'all' ? 'All projects' : nextFilter}`);
  }

  function selectFilter(nextFilter) {
    setFilter(nextFilter);
    toast(`Filter: ${nextFilter === 'all' ? 'All projects' : nextFilter}`);
  }

  function addProject(values) {
    createMutation.mutate({
      ...values,
      value: Number(values.value || 0),
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="theme-hero theme-hero-slate">
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Projects</p>
            <h1 className="hero-title">All projects</h1>
            <p className="hero-subtitle max-w-2xl">
              Search, filter, export, and add project records in a layout that collapses cleanly on mobile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                exportProjectsToExcel(filtered);
                toast.success('Export started');
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Library</CardTitle>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                className="w-56 bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>
            <Button variant="secondary" onClick={cycleFilter} title={`Current filter: ${filter}`}>
              <Filter className="h-4 w-4" />
              Filter {filter === 'all' ? '' : `: ${filter}`}
            </Button>
            <Button variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}>
              <List className="h-4 w-4" />
              Table
            </Button>
            <Button variant={view === 'cards' ? 'primary' : 'secondary'} onClick={() => setView('cards')}>
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={filter === 'all'} onClick={() => selectFilter('all')}>
              All
            </FilterChip>
            <FilterChip active={filter === 'residential'} tone="blue" onClick={() => selectFilter('residential')}>
              Residential
            </FilterChip>
            <FilterChip active={filter === 'commercial'} tone="amber" onClick={() => selectFilter('commercial')}>
              Commercial
            </FilterChip>
            <FilterChip active={filter === 'industrial'} tone="green" onClick={() => selectFilter('industrial')}>
              Industrial
            </FilterChip>
            <FilterChip active={filter === 'manufacturing'} tone="rose" onClick={() => selectFilter('manufacturing')}>
              Manufacturing
            </FilterChip>
          </div>

          {view === 'table' ? <ProjectsTable rows={filtered} /> : <MiniProjectList rows={filtered} />}
        </CardBody>
      </Card>

      <ProjectDialog open={open} onClose={() => setOpen(false)} onSubmit={addProject} />
    </div>
  );
}

function FilterChip({ active, tone = 'slate', children, onClick }) {
  const toneMap = {
    slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
    blue: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
    green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
    rose: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition ${toneMap[tone]} ${
        active ? 'scale-[1.02] shadow-sm' : 'opacity-80 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}

function ProjectsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Completion</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Tasks</th>
            <th className="px-4 py-3">Timer</th>
            <th className="px-4 py-3">Approval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b border-white/5 transition hover:bg-white/5">
              <td className="px-4 py-4">
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-xs text-slate-400">{item.client}</div>
              </td>
              <td className="px-4 py-4 text-slate-300">{item.typeShort || item.type}</td>
              <td className="px-4 py-4 text-slate-300">{item.location}</td>
              <td className="px-4 py-4 text-slate-400">
                {item.start} - {item.end}
              </td>
              <td className="px-4 py-4 font-semibold text-white">Rs. {item.value}</td>
              <td className="px-4 py-4 text-slate-300">{item.stage}</td>
              <td className="px-4 py-4">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-4">
                <PriorityBadge priority={item.priority} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-white/8">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${item.completion}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{item.completion}%</span>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-300">{item.engineer}</td>
              <td className="px-4 py-4 text-slate-300">{(item.tasks || []).length}</td>
              <td className="px-4 py-4">
                <TaskCountdownPill
                  dueDate={[...(item.tasks || [])].filter((task) => task.status !== 'done').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate}
                  compact
                />
              </td>
              <td className="px-4 py-4 text-slate-300">{item.approval}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
