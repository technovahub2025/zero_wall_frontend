import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import { addMonths, addYears, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, endOfYear, format, getMonth, getYear, isAfter, isBefore, isSameDay, isSameMonth, isWeekend, max, min, startOfDay, startOfMonth, startOfWeek, startOfYear, subDays } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Flame, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDuration } from '../../store/timerStore';
import { formatIndiaMinutesToTime, formatIndiaTime } from '../../utils/formatters';
import { getTimerActionLabel, getTimerReason } from '../../utils/timerLogDisplay';

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

function normalizeRange(start, end) {
  if (!start || !end) return null;
  const first = startOfDay(min([new Date(start), new Date(end)]));
  const last = endOfDay(max([new Date(start), new Date(end)]));
  return { start: first, end: last };
}

function isWithinRange(date, range) {
  if (!range?.start || !range?.end) return false;
  const current = new Date(date);
  return (isSameDay(current, range.start) || isAfter(current, range.start)) && (isSameDay(current, range.end) || isBefore(current, range.end));
}

function rangeDayCount(range) {
  if (!range?.start || !range?.end) return 0;
  return Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getBrowseSeed(range, dailySummary) {
  return new Date(range?.start || range?.end || getIndiaToday());
}

function getIndiaMonthRange() {
  const today = getIndiaToday();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
}

function toIndiaDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : '';
}

export function TimesheetCalendar({ dailySummary = [], allLogs = [], range, onRangeChange, resetViewToken = 0, className = '' }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [focusedDayKey, setFocusedDayKey] = useState('');
  const [dragAnchor, setDragAnchor] = useState(null);
  const [dragHover, setDragHover] = useState(null);
  const [browseDate, setBrowseDate] = useState(() => getBrowseSeed(range, dailySummary));
  const [pickerStage, setPickerStage] = useState('calendar');
  const [isPending, startTransition] = useTransition();
  const [calendarPanelHeight, setCalendarPanelHeight] = useState(0);
  const ignoreClickRef = useRef(false);
  const calendarPanelRef = useRef(null);

  const { summaryDays, calendarDays, totalHours, activeDays, peakDay, averageHours, summaryMap, topDays } = useMemo(() => {
    const map = new Map(
      dailySummary.map((item) => [
        toIndiaDateKey(item.date),
        {
          ...item,
          duration: Number(item.duration || 0),
          entries: Number(item.entries || 0),
          tasks: Number(item.tasks || 0),
          projects: Number(item.projects || 0),
          billable: Number(item.billable || 0),
          averageStartMinutes: Number(item.averageStartMinutes || 0),
        },
      ])
    );
    const rangeStart = range?.start ? startOfDay(new Date(range.start)) : null;
    const rangeEnd = range?.end ? endOfDay(new Date(range.end)) : null;
    const derivedStart = rangeStart || (dailySummary.length ? startOfDay(new Date(min(dailySummary.map((item) => new Date(item.date))))) : subDays(new Date(), 34));
    const derivedEnd = rangeEnd || (dailySummary.length ? endOfDay(new Date(max(dailySummary.map((item) => new Date(item.date))))) : new Date());
    const daysList = eachDayOfInterval({ start: derivedStart, end: derivedEnd });

    const summaryRows = daysList.map((day) => {
      const key = toIndiaDateKey(day);
      const item = map.get(key) || {};
      const duration = Number(item.duration || 0);
      return {
        key,
        date: day,
        duration,
        level: intensity(duration),
        entries: Number(item.entries || 0),
        tasks: Number(item.tasks || 0),
        billable: Number(item.billable || 0),
        averageStartMinutes: Number(item.averageStartMinutes || 0),
      };
    });

    const total = summaryRows.reduce((sum, item) => sum + item.duration, 0);
    const active = summaryRows.filter((item) => item.duration > 0).length;
    const peak = summaryRows.reduce((best, item) => (item.duration > (best?.duration || 0) ? item : best), summaryRows[0] || null);
    const top = [...summaryRows].filter((item) => item.duration > 0).sort((a, b) => b.duration - a.duration).slice(0, 5);
    const calendarStart = startOfWeek(startOfMonth(browseDate), { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(browseDate), { weekStartsOn: 0 });
    const calendarRows = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map((day) => {
      const key = toIndiaDateKey(day);
      const item = map.get(key) || {};
      const duration = Number(item.duration || 0);
      return {
        key,
        date: day,
        duration,
        level: intensity(duration),
        entries: Number(item.entries || 0),
        tasks: Number(item.tasks || 0),
        billable: Number(item.billable || 0),
        averageStartMinutes: Number(item.averageStartMinutes || 0),
        inMonth: isSameMonth(day, browseDate),
      };
    });

    return {
      summaryDays: summaryRows,
      calendarDays: calendarRows,
      totalHours: total,
      activeDays: active,
      peakDay: peak,
      averageHours: summaryRows.length ? total / summaryRows.length : 0,
      summaryMap: map,
      topDays: top,
    };
  }, [browseDate, dailySummary, range?.end, range?.start]);

  const activeRange = normalizeRange(dragAnchor, dragHover) || normalizeRange(range?.start, range?.end);
  const isDragging = Boolean(dragAnchor);
  const selectedDayCount = rangeDayCount(activeRange);
  const selectedDayKey = focusedDayKey || (selectedDayCount === 1 && activeRange?.start ? toIndiaDateKey(activeRange.start) : '');
  const selectedLogs = useMemo(() => {
    if (!selectedDayKey) return [];
    return allLogs
      .map((log, index) => ({
        id: String(log.id || log._id || `${log.date || log.startTime || log.createdAt || 'log'}-${index}`),
        date: log.date || log.startTime || log.createdAt,
        projectName: log.project?.projectName || log.projectName || '-',
        taskTitle: log.task?.title || log.taskTitle || '-',
        note: log.note || '',
        reason: log.reason || '',
        action: log.action || '',
        actionLabel: log.actionLabel || '',
        switchReason: log.switchReason || '',
        switchFromLog: log.switchFromLog || null,
        switchToTask: log.switchToTask || null,
        pausedAt: log.pausedAt || null,
        isBillable: Boolean(log.isBillable),
        isManual: Boolean(log.isManual),
        duration: Number(log.duration || 0),
        startTime: log.startTime || log.date || log.createdAt || null,
        endTime: log.endTime || null,
      }))
      .filter((log) => toIndiaDateKey(log.date) === selectedDayKey)
      .sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime());
  }, [allLogs, selectedDayKey]);
  const selectedSummary = useMemo(() => {
    if (!selectedDayKey) return null;
    const summary = summaryMap.get(selectedDayKey);
    if (summary && (summary.duration || summary.entries || summary.tasks || summary.billable)) {
      return summary;
    }

    const duration = selectedLogs.reduce((total, log) => total + Number(log.duration || 0), 0);
    const billable = selectedLogs.reduce((total, log) => total + (log.isBillable ? Number(log.duration || 0) : 0), 0);
    const summaryDate = activeRange?.start || selectedLogs[0]?.startTime || selectedLogs[0]?.date || null;
    const firstStart = selectedLogs[0]?.startTime || summaryDate;
    return {
      date: summaryDate || new Date(),
      duration,
      entries: selectedLogs.length,
      tasks: new Set(selectedLogs.map((log) => log.taskTitle || log.id)).size,
      billable,
      averageStartMinutes: firstStart ? new Date(firstStart).getHours() * 60 + new Date(firstStart).getMinutes() : 0,
    };
  }, [activeRange?.start, selectedDayKey, selectedLogs, summaryMap]);
  const activeRangeLabel = activeRange?.start && activeRange?.end ? `${format(activeRange.start, 'dd MMM yyyy')} to ${format(activeRange.end, 'dd MMM yyyy')}` : 'Interactive time range';
  const browseMonthLabel = format(browseDate, 'MMMM');
  const browseYearLabel = format(browseDate, 'yyyy');
  const selectedMonthIndex = getMonth(browseDate);
  const selectedYearValue = getYear(browseDate);
  const yearWindowStart = Math.floor(selectedYearValue / 12) * 12 - 5;
  const yearWindow = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const year = yearWindowStart + index;
        return { year, active: year === selectedYearValue };
      }),
    [selectedYearValue, yearWindowStart],
  );

  useEffect(() => {
    if (!dragAnchor) {
      setDragHover(null);
      ignoreClickRef.current = false;
    }
  }, [dragAnchor]);

  useEffect(() => {
    const nextSeed = getBrowseSeed(range, dailySummary);
    if (pickerStage === 'calendar') {
      setBrowseDate(nextSeed);
    }
  }, [dailySummary, pickerStage, range?.end, range?.start]);

  useEffect(() => {
    setBrowseDate(getIndiaToday());
    setPickerStage('calendar');
    setFocusedDayKey(toIndiaDateKey(getIndiaToday()));
  }, [resetViewToken]);

  useLayoutEffect(() => {
    const element = calendarPanelRef.current;
    if (!element) return undefined;

    const updateHeight = () => {
      setCalendarPanelHeight(Math.round(element.getBoundingClientRect().height));
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(element);
    return () => observer.disconnect();
  }, [browseDate, calendarDays.length, pickerStage, selectedLogs.length, selectedSummary?.date, topDays.length]);

  function commitRange(start, end) {
    if (!start || !end) return;
    const next = normalizeRange(start, end);
    if (next && onRangeChange) {
      startTransition(() => {
        onRangeChange({ start: next.start.toISOString(), end: next.end.toISOString() });
      });
    }
  }

  function clearRange() {
    if (!onRangeChange) return;
    const nextRange = getIndiaMonthRange();
    const today = getIndiaToday();
    setBrowseDate(today);
    setFocusedDayKey(toIndiaDateKey(today));
    setPickerStage('calendar');
    startTransition(() => {
      onRangeChange({ start: nextRange.start.toISOString(), end: nextRange.end.toISOString() });
    });
  }

  function cyclePickerStage() {
    setPickerStage((current) => {
      if (current === 'calendar') return 'year';
      if (current === 'year') return 'month';
      return 'calendar';
    });
  }

  function stepRange(direction) {
    const shifted =
      pickerStage === 'year'
        ? addYears(browseDate, direction * 12)
        : pickerStage === 'month'
          ? addMonths(browseDate, direction)
          : addMonths(browseDate, direction);
    setBrowseDate(shifted);
  }

  function chooseYear(year) {
    const nextDate = new Date(year, selectedMonthIndex, 1);
    setBrowseDate(nextDate);
    setPickerStage('month');
  }

  function chooseMonth(monthIndex) {
    const nextDate = new Date(selectedYearValue, monthIndex, 1);
    setBrowseDate(nextDate);
    commitRange(startOfMonth(nextDate), endOfMonth(nextDate));
    setPickerStage('calendar');
  }

  function handleDayPointerDown(day, event) {
    ignoreClickRef.current = false;
    setDragAnchor(day.date);
    setDragHover(day.date);
    setHoveredDay(day);

    if (event?.currentTarget?.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture failures on unsupported browsers.
      }
    }
  }

  function handleDayPointerEnter(day) {
    setHoveredDay(day);
    if (dragAnchor) {
      setDragHover(day.date);
    }
  }

  function handleDayPointerUp(day, event) {
    if (!dragAnchor) {
      if (event?.shiftKey && range?.start) {
        commitRange(range.start, day.date);
      } else if (selectedDayCount === 1 && activeRange?.start && isSameDay(activeRange.start, day.date)) {
        clearRange();
      } else {
        commitRange(day.date, day.date);
      }
    } else {
      const endDate = dragHover || day.date;
      if (event?.shiftKey && range?.start) {
        commitRange(range.start, endDate);
      } else {
        commitRange(dragAnchor, endDate);
      }
    }

    ignoreClickRef.current = true;
    setDragAnchor(null);
    setDragHover(null);

    if (event?.currentTarget?.releasePointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore pointer release failures.
      }
    }
  }

  function handleDayPointerCancel() {
    ignoreClickRef.current = false;
    setDragAnchor(null);
    setDragHover(null);
  }

  function handleDayClick(day, event) {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    if (event.shiftKey && range?.start) {
      commitRange(range.start, day.date);
      return;
    }

    if (!dragAnchor) {
      if (selectedDayCount === 1 && activeRange?.start && isSameDay(activeRange.start, day.date)) {
        setFocusedDayKey(toIndiaDateKey(day.date));
        clearRange();
        return;
      }

      setFocusedDayKey(toIndiaDateKey(day.date));
      commitRange(day.date, day.date);
    }
  }

  return (
    <div className={cn('rounded-3xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.82)] p-4 shadow-sm backdrop-blur', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 font-display text-base font-semibold text-[rgb(var(--text))] sm:text-lg">
              <CalendarDays className="h-5 w-5 text-sky-500" />
              Calendar Heatmap
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{activeRangeLabel}</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-1 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.9)] p-1 shadow-sm sm:inline-flex sm:w-auto sm:grid-cols-none">
              <button
                type="button"
                onClick={() => stepRange(-1)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-transparent text-[rgb(var(--text))] transition hover:border-sky-400/25 hover:bg-sky-500/5 hover:text-sky-600"
                aria-label={`Previous ${pickerStage}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cyclePickerStage}
                className={cn(
                  'min-w-0 px-2 py-3 text-center text-sm font-semibold leading-tight transition hover:text-sky-600 sm:min-w-[190px] sm:px-3 sm:text-lg',
                  pickerStage === 'calendar' ? 'text-[rgb(var(--text))]' : 'text-sky-600',
                )}
                aria-label="Change date browser"
              >
                {browseMonthLabel} {browseYearLabel}
              </button>
              <button
                type="button"
                onClick={() => stepRange(1)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-transparent text-[rgb(var(--text))] transition hover:border-sky-400/25 hover:bg-sky-500/5 hover:text-sky-600"
                aria-label={`Next ${pickerStage}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button type="button" size="sm" variant="ghost" className="w-full sm:w-auto" onClick={clearRange}>
              Clear
            </Button>
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
              <span key={tone} className={cn('h-3 w-3 rounded-sm ring-1 ring-black/5 transition-transform duration-300', tone)} />
            ))}
          </div>
          <span>High intensity</span>
          {isPending ? <Badge tone="blue">Updating range</Badge> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <div className="min-w-0">
          {pickerStage === 'year' ? (
            <div ref={calendarPanelRef} className="rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.9)] p-4 shadow-sm transition-all duration-300 sm:p-5">
              <div className="mb-4">
                <div className="text-base font-semibold text-[rgb(var(--text))] sm:text-lg">{browseYearLabel}</div>
                <div className="mt-1 text-xs text-slate-500">Click a year to browse months.</div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {yearWindow.map(({ year, active }) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => chooseYear(year)}
                    className={cn(
                      'rounded-2xl border px-4 py-5 text-center text-base font-semibold transition-all duration-300 ease-out hover:-translate-y-[1px] hover:shadow-sm',
                      active
                        ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.72)] text-[rgb(var(--text))] hover:border-sky-400/30 hover:bg-sky-500/10',
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          ) : pickerStage === 'month' ? (
            <div ref={calendarPanelRef} className="rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.9)] p-4 shadow-sm transition-all duration-300 sm:p-5">
              <div className="mb-4">
                <div className="text-base font-semibold text-[rgb(var(--text))] sm:text-lg">{browseMonthLabel} {browseYearLabel}</div>
                <div className="mt-1 text-xs text-slate-500">Click a month to return to the calendar.</div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MONTH_NAMES.map((month, monthIndex) => {
                  const active = monthIndex === selectedMonthIndex;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => chooseMonth(monthIndex)}
                      className={cn(
                        'rounded-2xl border px-4 py-5 text-center text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-[1px] hover:shadow-sm',
                        active
                          ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                          : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.72)] text-[rgb(var(--text))] hover:border-sky-400/30 hover:bg-sky-500/10',
                      )}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div ref={calendarPanelRef}>
              <div className="mb-2 grid grid-cols-7 gap-1.5 px-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:gap-2 sm:px-1 sm:text-[10px] sm:tracking-[0.18em]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day} className="text-center">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const isHovered = hoveredDay?.key === day.key;
                  const isSelected = activeRange ? isWithinRange(day.date, activeRange) : false;
                  const isFocused = isSelected && selectedDayCount === 1;
                  const weekend = isWeekend(day.date);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onPointerDown={(event) => handleDayPointerDown(day, event)}
                      onPointerEnter={() => handleDayPointerEnter(day)}
                      onPointerUp={(event) => handleDayPointerUp(day, event)}
                      onPointerCancel={handleDayPointerCancel}
                      onPointerLeave={() => setHoveredDay(null)}
                      onClick={(event) => handleDayClick(day, event)}
                      title={`${format(day.date, 'dd MMM yyyy')} - ${formatDuration(day.duration)} across ${day.entries} entries and ${day.tasks} tasks`}
                      className={cn(
                        'group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[9px] transition-all duration-300 ease-out will-change-transform sm:rounded-2xl sm:text-[10px]',
                        day.inMonth ? '' : 'opacity-45',
                        day.level === 0
                          ? 'border-slate-200 bg-slate-50 text-slate-500'
                          : day.level === 1
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : day.level === 2
                              ? 'border-sky-300 bg-sky-100 text-sky-800'
                              : day.level === 3
                                ? 'border-sky-400 bg-sky-200 text-sky-900'
                                : 'border-sky-500 bg-sky-500 text-white',
                        weekend ? 'ring-1 ring-amber-200/60' : '',
                        isSelected ? 'shadow-md shadow-sky-200/40 ring-2 ring-sky-400/20' : '',
                        isFocused ? '-translate-y-2 scale-[1.04] z-10 rounded-[28px] ring-4 ring-sky-300/40 shadow-[0_20px_38px_-22px_rgba(14,165,233,0.6)]' : '',
                        isDragging ? 'cursor-grabbing' : 'cursor-pointer',
                        isHovered ? 'scale-[1.02] shadow-md shadow-sky-200/40' : 'hover:-translate-y-[1px] hover:shadow-sm',
                      )}
                    >
                      <span className="font-semibold leading-none">{format(day.date, 'dd')}</span>
                      <span className="mt-0.5 opacity-80 leading-none">{formatHours(day.duration)}</span>
                      {day.entries > 0 ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/80 sm:right-2 sm:top-2 sm:h-2 sm:w-2" /> : null}
                      {day.entries > 1 ? <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-60 sm:h-1.5 sm:w-1.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside
          className="flex min-h-0 self-start flex-col overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.72)] p-4 transition-all duration-300 sm:p-5"
          style={calendarPanelHeight ? { height: `${calendarPanelHeight}px`, maxHeight: `${calendarPanelHeight}px` } : undefined}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{selectedSummary ? 'Day details' : 'Top days'}</div>
          <div className="mt-3 flex min-h-0 flex-col">
            {selectedSummary ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.88)] p-3 shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{format(selectedSummary.date, 'dd MMM yyyy')}</div>
                    <div className="text-xs text-slate-500">{format(selectedSummary.date, 'EEEE')}</div>
                  </div>
                  <Badge tone="sky">{formatHours(selectedSummary.duration)}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--panel-2)/0.74)] px-3 py-2">
                    <span>Entries</span>
                    <span className="font-semibold text-[rgb(var(--text))]">{selectedSummary.entries || selectedLogs.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--panel-2)/0.74)] px-3 py-2">
                    <span>Tasks</span>
                    <span className="font-semibold text-[rgb(var(--text))]">{selectedSummary.tasks || selectedLogs.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--panel-2)/0.74)] px-3 py-2">
                    <span>Billable</span>
                    <span className="font-semibold text-[rgb(var(--text))]">{selectedSummary.billable ? `${formatHours(selectedSummary.billable)}` : selectedLogs.some((log) => log.isBillable) ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--panel-2)/0.74)] px-3 py-2">
                    <span>Avg start</span>
                    <span className="font-semibold text-[rgb(var(--text))]">
                      {Number.isFinite(selectedSummary.averageStartMinutes) && selectedSummary.averageStartMinutes > 0
                        ? formatIndiaMinutesToTime(selectedSummary.averageStartMinutes)
                        : selectedLogs.length
                          ? formatIndiaTime(new Date(selectedLogs[0].startTime))
                          : '-'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Logs</div>
                  <div className="scrollbar-none mt-1 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                    {selectedLogs.length ? (
                      selectedLogs.map((log) => {
                        const actionLabel = getTimerActionLabel(log);
                        const reason = getTimerReason(log);
                        return (
                        <div key={log.id} className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.74)] px-2.5 py-1.5 text-xs transition-all duration-200 hover:bg-[rgb(var(--panel)/0.9)]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[rgb(var(--text))]">{log.projectName}</div>
                              <div className="truncate text-slate-500">{log.taskTitle}</div>
                            </div>
                            <Badge tone={log.isBillable ? 'green' : 'slate'}>{formatHours(log.duration)}</Badge>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                            <span>{log.startTime ? formatIndiaTime(new Date(log.startTime)) : '-'}</span>
                            <span className="min-w-0 truncate text-right">{reason ? `${actionLabel}: ${reason}` : actionLabel}</span>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.78)] px-3 py-4 text-sm text-[rgb(var(--muted))]">No logs for this day.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : topDays.length ? (
              <div className="grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {topDays.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.78)] px-3 py-2 transition-transform duration-300 hover:-translate-y-[1px] hover:shadow-sm">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{format(item.date, 'dd MMM')}</div>
                      <div className="text-xs text-slate-500">{format(item.date, 'EEE')}</div>
                    </div>
                    <Badge tone="sky">{formatHours(item.duration)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.78)] px-3 py-4 text-sm text-[rgb(var(--muted))]">No logged days yet.</div>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-4 text-xs leading-5 text-slate-500">
        Showing {summaryDays.length} summarized day{summaryDays.length === 1 ? '' : 's'} from the selected range.
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.76)] p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}
