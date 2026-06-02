import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../api/dashboard';
import {
  ActionItemsCard,
  KpiGrid,
  ProjectTrackerCard,
  RevenueChartCard,
  TaskQueueCard,
  TeamWorkloadCard,
} from '../components/dashboard/Widgets';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: fetchDashboard,
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Dashboard</p>
            <h1 className="hero-title">Project portfolio control center</h1>
            <p className="hero-subtitle">
              A responsive operations view for projects, approvals, billing, and team load. The layout
              is converted from the static HTML into a route-driven React app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.84)] px-4 py-3 text-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Live projects</div>
              <div className="mt-1 font-display text-lg font-semibold text-[rgb(var(--text))]">
                {data?.summary?.totalProjects ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.84)] px-4 py-3 text-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pending approvals</div>
              <div className="mt-1 font-display text-lg font-semibold text-[rgb(var(--text))]">
                {data?.summary?.pendingApprovals ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.84)] px-4 py-3 text-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Open tasks</div>
              <div className="mt-1 font-display text-lg font-semibold text-[rgb(var(--text))]">
                {data?.tasks?.summary?.open ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      <KpiGrid items={data?.kpis || []} />

      <TaskQueueCard tasks={data?.tasks?.items || []} title="Task Queue" subtitle="Countdown timers and assignees across the active project list" />

      <ProjectTrackerCard rows={data?.projects || []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChartCard rows={data?.revenueSummary || []} />
        <TeamWorkloadCard
          members={(data?.team || []).map((member) => ({
            name: member.name,
            count: member.projects,
            color: member.color,
          }))}
        />
      </div>

      <ActionItemsCard items={data?.actions || []} />
    </div>
  );
}
