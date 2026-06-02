import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fetchDashboard, fetchStages } from '../api/dashboard';
import { StageGuideCard, StageTimelineCard, TaskQueueCard } from '../components/dashboard/Widgets';
import { Badge } from '../components/ui/badge';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';

export function StagesPage() {
  const { data: dashboard = {} } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: fetchDashboard,
  });
  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: fetchStages,
  });

  const steps = [...new Set(stages.map((stage) => stage.stageName))];

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-green p-5 sm:p-6">
        <p className="hero-kicker">Stage Detail</p>
        <h1 className="hero-title">Stage timeline and approval log</h1>
      </section>

      <StageTimelineCard steps={steps} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <StageTableCard rows={stages} />
        <div className="space-y-6">
          <StageGuideCard stages={stages} />
          <TaskQueueCard tasks={dashboard?.tasks?.items || []} title="Stage Work Queue" subtitle="Tasks linked to active stage delivery and approval timing" limit={5} />
        </div>
      </div>
    </div>
  );
}

function StageTableCard({ rows = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Stage Detail and Client Approval Log</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Stage Name</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deliverable</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.proj}-${item.stageNo}-${item.stageName}`} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{item.proj}</div>
                    <div className="text-xs text-slate-400">{item.client}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.stageNo}</td>
                  <td className="px-4 py-4 text-slate-300">{item.stageName}</td>
                  <td className="px-4 py-4 text-slate-400">{format(parseISO(item.start), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-4 text-slate-400">{format(parseISO(item.endPlan), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-4 text-slate-400">{item.endActual === '-' ? '-' : format(parseISO(item.endActual), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-4">
                    <Badge tone={item.status === 'done' ? 'green' : item.status === 'review' ? 'blue' : 'amber'}>
                      {item.status === 'done' ? 'Completed' : item.status === 'review' ? 'In Review' : 'In Progress'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.deliverable}</td>
                  <td className="px-4 py-4 text-slate-300">{item.approval}</td>
                  <td className="px-4 py-4 text-slate-400">{item.next}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-400" colSpan="10">
                    No stage records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
