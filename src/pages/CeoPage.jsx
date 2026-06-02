import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../api/dashboard';
import { ActionItemsCard, KpiGrid, RevenueChartCard, StageGuideCard, TaskQueueCard } from '../components/dashboard/Widgets';

export function CeoPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: fetchDashboard,
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-amber p-5 sm:p-6">
        <p className="hero-kicker">CEO / MD View</p>
        <h1 className="hero-title">Executive control panel</h1>
      </section>

      <KpiGrid items={data?.kpis || []} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <ActionItemsCard items={data?.actions || []} showActions />
        <TaskQueueCard
          tasks={data?.tasks?.items || []}
          title="Priority Tasks"
          subtitle="Urgent work with assignee ownership and live countdown"
          limit={6}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChartCard rows={data?.revenueSummary || []} />
        <StageGuideCard stages={data?.stages || []} />
      </div>
    </div>
  );
}
