import { useMemo } from 'react';
import { BarChart3, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { useUiStore } from '../../store/uiStore';
import { clamp, cn } from '../../lib/utils';

export function RevenueChart({ data = [] }) {
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';

  const rows = useMemo(
    () =>
      data
        .map((item) => {
          const received = Number(item.received || 0);
          const balance = Number(item.balance || 0);
          const total = received + balance;
          const progress = total > 0 ? clamp(Math.round((received / total) * 100), 0, 100) : 0;

          return { ...item, received, balance, total, progress };
        })
        .sort((a, b) => b.total - a.total),
    [data],
  );

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.received += row.received;
          acc.balance += row.balance;
          acc.total += row.total;
          return acc;
        },
        { received: 0, balance: 0, total: 0 },
      ),
    [rows],
  );

  const healthRows = useMemo(() => {
    const buckets = [
      { key: 'healthy', label: 'Healthy 75%+', count: 0, color: '#10b981' },
      { key: 'watch', label: 'Watch 50-74%', count: 0, color: '#3b82f6' },
      { key: 'risk', label: 'Risk 25-49%', count: 0, color: '#f59e0b' },
      { key: 'critical', label: 'Critical <25%', count: 0, color: '#ef4444' },
    ];

    rows.forEach((row) => {
      if (row.progress >= 75) buckets[0].count += 1;
      else if (row.progress >= 50) buckets[1].count += 1;
      else if (row.progress >= 25) buckets[2].count += 1;
      else buckets[3].count += 1;
    });

    return buckets;
  }, [rows]);

  const topRow = rows[0] || null;
  const weakestRow = rows.length ? [...rows].sort((a, b) => a.progress - b.progress)[0] : null;

  return (
    <Card className="w-full self-start overflow-hidden">
      <CardHeader className="items-start gap-2">
        <div>
          <CardTitle>Revenue Pipeline</CardTitle>
          <p className="mt-1 text-xs text-slate-500">High-signal summary of collected and pending amounts.</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
          <BarChart3 className="h-3.5 w-3.5" />
          Rs. Lakhs
        </span>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Received" value={summary.received} hint="Collected so far" tone="blue" icon={Landmark} isLight={isLight} />
          <StatCard label="Pending" value={summary.balance} hint="Remaining to bill" tone="slate" icon={Wallet} isLight={isLight} />
          <StatCard
            label="Collection Rate"
            value={`${summary.total ? Math.round((summary.received / summary.total) * 100) : 0}%`}
            hint="Weighted across projects"
            tone="emerald"
            icon={PiggyBank}
            isLight={isLight}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-[rgb(var(--line)/0.16)] dark:bg-[rgb(var(--panel-2)/0.78)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 text-xs uppercase tracking-[0.18em] text-slate-400 dark:border-[rgb(var(--line)/0.16)]">
              <span>Collection health</span>
              <span>{rows.length} projects</span>
            </div>

            <div className="mt-3 h-[220px]">
              {rows.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthRows} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="label" width={124} tickLine={false} axisLine={false} interval={0} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.04)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                            <div className="text-xs font-semibold text-[rgb(var(--text))]">{label}</div>
                            <div className="mt-1 text-xs text-slate-500">{payload[0]?.value || 0} projects</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={18}>
                      {healthRows.map((row) => (
                        <Cell key={row.key} fill={row.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className={cn(
                    'flex h-full items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-slate-400',
                    isLight ? 'border-slate-200 bg-white' : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.78)]',
                  )}
                >
                  No revenue data available.
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {healthRows.map((row) => (
                <span
                  key={row.key}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.12)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-[rgb(var(--panel-2)/0.78)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.label}: {row.count}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SummaryCard
              title="Top collection"
              name={topRow?.name || 'No data'}
              accent="emerald"
              value={topRow ? `${topRow.progress}%` : '--'}
              detail={topRow ? `${topRow.received} received · ${topRow.balance} pending` : 'No active revenue rows available.'}
              isLight={isLight}
            />
            <SummaryCard
              title="Needs attention"
              name={weakestRow?.name || 'No data'}
              accent="rose"
              value={weakestRow ? `${weakestRow.progress}%` : '--'}
              detail={weakestRow ? `${weakestRow.received} received · ${weakestRow.balance} pending` : 'No active revenue rows available.'}
              isLight={isLight}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function StatCard({ label, value, hint, tone = 'slate', icon: Icon, isLight = false }) {
  const styles = {
    blue: isLight ? 'border-sky-200 bg-sky-50/80 text-sky-700' : 'border-sky-400/20 bg-sky-500/10 text-sky-200',
    slate: isLight ? 'border-slate-200 bg-slate-50/80 text-slate-700' : 'border-white/10 bg-white/5 text-slate-200',
    emerald: isLight ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  };

  return (
    <div className={cn('rounded-2xl border p-3 transition hover:-translate-y-0.5', styles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-2 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
        </div>
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function SummaryCard({ title, name, accent, value, detail, isLight = false }) {
  const accents = {
    emerald: isLight ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    rose: isLight ? 'border-rose-200 bg-rose-50/80 text-rose-700' : 'border-rose-400/20 bg-rose-500/10 text-rose-200',
  };

  return (
    <div className={cn('rounded-2xl border p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5', isLight ? 'border-slate-200/80 bg-white' : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.78)]')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{title}</div>
          <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{name}</div>
        </div>
        <div className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', accents[accent] || accents.emerald)}>{value}</div>
      </div>
      <div className="mt-2 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

