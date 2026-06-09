import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';

export function WorkloadPanel({ members = [] }) {
  const totalProjects = members.reduce((sum, member) => sum + Number(member.projects || 0), 0);
  const peak = Math.max(...members.map((member) => Number(member.projects || 0)), 1);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="items-start gap-2">
        <div>
          <CardTitle>Workload</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Quick view of active assignments by teammate.</p>
        </div>
        <span className="ml-auto rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
          {totalProjects} projects
        </span>
      </CardHeader>
      <CardBody className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {members.length ? members.map((member) => {
          const count = Number(member.projects || 0);
          const width = Math.max(Math.round((count / peak) * 100), 10);

          return (
            <div key={member.name} className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-[rgb(var(--line)/0.16)] dark:bg-[rgb(var(--panel-2)/0.78)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-[rgb(var(--text))]">{member.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{member.online ? 'Online now' : 'Offline'}</div>
                </div>
                <div className="shrink-0 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
                  {count} projects
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-400 dark:border-[rgb(var(--line)/0.16)] dark:bg-[rgb(var(--panel-2)/0.78)]">
            No workload data.
          </div>
        )}
      </CardBody>
    </Card>
  );
}
