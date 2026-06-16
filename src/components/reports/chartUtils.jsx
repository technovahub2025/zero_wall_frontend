export const REPORT_COLORS = {
  blue: '#3b82f6',
  blueSoft: '#dbeafe',
  emerald: '#10b981',
  emeraldSoft: '#d1fae5',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  rose: '#ef4444',
  roseSoft: '#ffe4e6',
  violet: '#8b5cf6',
  violetSoft: '#ede9fe',
  cyan: '#06b6d4',
  slate: '#64748b',
  grid: '#dbe4ee',
  axis: '#64748b',
};

export const REPORT_PALETTE = [
  REPORT_COLORS.blue,
  REPORT_COLORS.emerald,
  REPORT_COLORS.amber,
  REPORT_COLORS.rose,
  REPORT_COLORS.violet,
  REPORT_COLORS.cyan,
  REPORT_COLORS.slate,
];

export function formatCompactCurrency(value = 0) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return 'Rs. 0';
  if (number >= 100000) {
    return `Rs. ${(number / 100000).toFixed(1)}L`;
  }
  return `Rs. ${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatHours(value = 0) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0h';
  return `${number.toLocaleString('en-IN', { maximumFractionDigits: 1 })}h`;
}

export function formatPercent(value = 0) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0%';
  return `${number.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
}

export function formatMonthLabel(value = '') {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || 'Unknown';
  const [year, monthValue] = value.split('-');
  const parsed = new Date(Number(year), Number(monthValue) - 1, 1);
  return parsed.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export function truncateChartLabel(value = '', maxLength = 16) {
  const text = String(value ?? '').trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function EmptyChartState({ label = 'No data available.' }) {
  return (
    <div className="theme-chart-surface grid h-full min-h-[280px] place-items-center rounded-[var(--radius)] border border-dashed border-[rgb(var(--line)/0.16)] px-4 text-center">
      <div>
        <div className="mx-auto h-10 w-10 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.74)] shadow-sm" />
        <div className="mt-3 text-sm font-semibold text-[rgb(var(--text))]">No report data</div>
        <div className="mt-1 text-xs text-[rgb(var(--muted))]">{label}</div>
      </div>
    </div>
  );
}

function resolveSeriesColor(entry) {
  const candidate = entry?.color || entry?.fill || entry?.stroke;
  if (candidate && !String(candidate).startsWith('url(')) return candidate;

  const payloadColor = entry?.payload?.color || entry?.payload?.fill || entry?.payload?.stroke;
  if (payloadColor && !String(payloadColor).startsWith('url(')) return payloadColor;

  const fallbackByKey = {
    completed: REPORT_COLORS.emerald,
    inProgress: REPORT_COLORS.blue,
    pending: REPORT_COLORS.amber,
    overdue: REPORT_COLORS.rose,
    active: REPORT_COLORS.blue,
    delayed: REPORT_COLORS.rose,
    onHold: REPORT_COLORS.amber,
    revenue: REPORT_COLORS.blue,
    collected: REPORT_COLORS.emerald,
    loggedHours: REPORT_COLORS.violet,
    billableHours: REPORT_COLORS.emerald,
    utilization: REPORT_COLORS.violet,
    value: REPORT_COLORS.blue,
  };

  return fallbackByKey[entry?.dataKey] || REPORT_COLORS.blue;
}

export function ReportTooltip({ active, payload, label, currency = false, hours = false, percent = false }) {
  if (!active || !payload?.length) return null;
  const visiblePayload = payload.filter((entry, index, entries) => {
    const entryKey = `${entry?.dataKey || ''}:${entry?.name || ''}`;
    return entries.findIndex((candidate) => `${candidate?.dataKey || ''}:${candidate?.name || ''}` === entryKey) === index;
  });

  return (
    <div className="min-w-[190px] rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.98)] px-3 py-2 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
      {label ? <div className="border-b border-[rgb(var(--line)/0.12)] pb-1.5 text-xs font-semibold text-[rgb(var(--text))]">{label}</div> : null}
      <div className="mt-2 space-y-1.5">
        {visiblePayload.map((entry, index) => (
          <div key={`${entry.dataKey || entry.name || 'series'}-${index}`} className="flex items-center justify-between gap-6 text-xs">
            <div className="flex items-center gap-2 text-[rgb(var(--muted))]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: resolveSeriesColor(entry) }} />
              <span>{entry.name || entry.dataKey}</span>
            </div>
            <span className="font-semibold text-[rgb(var(--text))]">
              {currency ? formatCompactCurrency(entry.value) : hours ? formatHours(entry.value) : percent ? formatPercent(entry.value) : Number(entry.value || 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSummaryPill({ label, value, tone = 'blue' }) {
  const toneClass =
    {
      blue: 'bg-sky-500/15 text-sky-500 ring-sky-400/20',
      green: 'bg-emerald-500/15 text-emerald-500 ring-emerald-400/20',
      amber: 'bg-amber-500/15 text-amber-500 ring-amber-400/20',
      rose: 'bg-rose-500/15 text-rose-500 ring-rose-400/20',
      violet: 'bg-violet-500/15 text-violet-500 ring-violet-400/20',
      slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
    }[tone] || 'bg-sky-500/15 text-sky-500 ring-sky-400/20';

  return (
    <div className={`rounded-2xl px-3 py-2 text-right ring-1 ${toneClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}
