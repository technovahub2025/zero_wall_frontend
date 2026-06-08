import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { CalendarDays, Clock3, Flame, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

function intensity(duration = 0) {
  if (duration <= 0) return 0;
  if (duration < 3600) return 1;
  if (duration < 7200) return 2;
  if (duration < 14400) return 3;
  return 4;
}

function formatHours(duration = 0) {
  return `${Math.round(Number(duration || 0) / 3600)}h`;
}

export function TimesheetCalendar({ dailySummary = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const { days, totalHours, activeDays, peakDay, averageHours, summaryMap, topDays } = useMemo(() => {
    const map = new Map(dailySummary.map((item) => [item.date, Number(item.duration || 0)]));
    const daysList = Array.from({ length: 35 }).map((_, index) => subDays(new Date(), 34 - index));
    const summaryRows = daysList.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const duration = map.get(key) || 0;
      return { key, date: day, duration, level: intensity(duration) };
    });

    const total = summaryRows.reduce((sum, item) => sum + item.duration, 0);
    const active = summaryRows.filter((item) => item.duration > 0).length;
    const peak = summaryRows.reduce((best, item) => (item.duration > (best?.duration || 0) ? item : best), summaryRows[0] || null);
    const top = [...summaryRows].filter((item) => item.duration > 0).sort((a, b) => b.duration - a.duration).slice(0, 5);

    return {
      days: summaryRows,
      totalHours: total,
      activeDays: active,
      peakDay: peak,
      averageHours: summaryRows.length ? total / summaryRows.length : 0,
      summaryMap: map,
      topDays: top,
    };
  }, [dailySummary]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-[rgb(var(--text))]">
              <CalendarDays className="h-5 w-5 text-sky-500" />
              Calendar Heatmap
            </div>
            <div className="mt-1 text-xs text-slate-500">Last 35 days of logged time</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total hours" value={formatHours(totalHours)} icon={Clock3} />
            <Metric label="Active days" value={String(activeDays)} icon={Flame} />
            <Metric label="Average / day" value={formatHours(averageHours)} icon={TrendingUp} />
            <Metric label="Peak day" value={peakDay?.duration ? formatHours(peakDay.duration) : '0h'} icon={CalendarDays} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Low</span>
          <div className="flex items-center gap-1">
            {['bg-slate-100', 'bg-sky-200', 'bg-sky-300', 'bg-sky-400', 'bg-sky-500'].map((tone) => (
              <span key={tone} className={cn('h-3 w-3 rounded-sm ring-1 ring-black/5', tone)} />
            ))}
          </div>
          <span>High intensity</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-2 grid grid-cols-7 gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="text-center">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const isHovered = hoveredDay?.key === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${format(day.date, 'dd MMM yyyy')} · ${formatHours(day.duration)}`}
                  className={cn(
                    'group relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-[10px] transition',
                    day.level === 0
                      ? 'border-slate-200 bg-slate-50 text-slate-500'
                      : day.level === 1
                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                        : day.level === 2
                          ? 'border-sky-300 bg-sky-100 text-sky-800'
                          : day.level === 3
                            ? 'border-sky-400 bg-sky-200 text-sky-900'
                            : 'border-sky-500 bg-sky-500 text-white',
                    isHovered ? 'scale-[1.02] shadow-md shadow-sky-200/40 ring-2 ring-sky-400/20' : 'hover:-translate-y-[1px] hover:shadow-sm',
                  )}
                >
                  <span className="font-semibold">{format(day.date, 'dd')}</span>
                  <span className="opacity-80">{formatHours(day.duration)}</span>
                  {day.duration > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/80" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Day detail</div>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">
                {hoveredDay ? format(hoveredDay.date, 'dd MMM yyyy') : 'Hover a day'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {hoveredDay ? `${formatHours(hoveredDay.duration)} logged` : 'See the exact log total for any day.'}
              </div>
              <div className="mt-3">
                <Badge tone={hoveredDay?.level > 0 ? 'blue' : 'slate'}>
                  {hoveredDay?.level > 0 ? 'Logged' : 'No activity'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Top days</div>
            <div className="mt-2 space-y-2">
              {topDays.length ? topDays.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{format(item.date, 'dd MMM')}</div>
                    <div className="text-xs text-slate-500">{format(item.date, 'EEE')}</div>
                  </div>
                  <Badge tone="sky">{formatHours(item.duration)}</Badge>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  No logged days yet.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Showing {summaryMap.size} summarized day{summaryMap.size === 1 ? '' : 's'} from the selected range.
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}
