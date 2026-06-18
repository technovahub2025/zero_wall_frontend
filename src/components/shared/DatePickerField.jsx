import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { cn } from '../../lib/utils';
import { formatIndiaDate, formatIndiaDateTime, formatIndiaTime, parseIndiaTimeInput } from '../../utils/formatters';

function toValidDate(value) {
  if (!value) return null;
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateValue(date) {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

function toDateTimeValue(date, time = '09:00') {
  if (!date) return '';
  const safeTime = parseIndiaTimeInput(time) || '09:00';
  return `${format(date, 'yyyy-MM-dd')}T${safeTime}`;
}

function getDisplayValue(value, placeholder) {
  const date = toValidDate(value);
  return date ? formatIndiaDate(date) : placeholder;
}

function getPopoverStyle(anchor, width, height) {
  if (typeof window === 'undefined' || !anchor) return null;
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.max(padding, Math.min(anchor.left, viewportWidth - width - padding));
  const spaceBelow = viewportHeight - anchor.bottom - padding;
  const spaceAbove = anchor.top - padding;
  const openAbove = spaceBelow < height && spaceAbove > spaceBelow;
  const top = openAbove ? Math.max(padding, anchor.top - height - padding) : anchor.bottom + padding;
  return {
    position: 'fixed',
    left,
    top,
    width,
    maxHeight: `min(${height}px, calc(100vh - 1rem))`,
  };
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  className = '',
  minDate,
  maxDate,
  clearable = true,
}) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [month, setMonth] = useState(() => startOfMonth(toValidDate(value) || new Date()));

  const selectedDate = useMemo(() => toValidDate(value), [value]);

  useEffect(() => {
    if (selectedDate) {
      setMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    function handleClickAway(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target) &&
        !(panelRef.current && panelRef.current.contains(event.target))
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('mousedown', handleClickAway);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !rootRef.current) return undefined;

    const updatePosition = () => {
      const anchor = rootRef.current.getBoundingClientRect();
      setPanelStyle(getPopoverStyle(anchor, Math.min(296, window.innerWidth - 16), 320));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const blanks = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}`, blank: true }));
    const dates = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => ({ key: day.toISOString(), day }));
    return [...blanks, ...dates];
  }, [month]);

  const min = toValidDate(minDate);
  const max = toValidDate(maxDate);
  const valueLabel = getDisplayValue(value, placeholder);

  function selectDate(nextDate) {
    if (!nextDate) return;
    if (min && nextDate < startOfMonth(min) && !isSameDay(nextDate, min)) return;
    if (max && nextDate > max && !isSameDay(nextDate, max)) return;
    onChange?.(toDateValue(nextDate));
    setMonth(startOfMonth(nextDate));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn('relative block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <button
        type="button"
        className="input flex min-h-[42px] items-center justify-between gap-3 text-left"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={cn('truncate', selectedDate ? 'text-[rgb(var(--text))]' : 'text-slate-400')}>
          {valueLabel}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}

      {open && panelStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              className="z-[999] w-[min(18.5rem,calc(100vw-1rem))] overflow-auto rounded-[20px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.99)] p-2.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur"
              style={panelStyle}
            >
          <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--line)/0.08)] pb-2.5">
            <div className="text-xs font-semibold text-[rgb(var(--text))]">{format(month, 'MMMM yyyy')}</div>
            <div className="flex items-center gap-1">
              <IconButton
                label="Previous month"
                onClick={() => setMonth((current) => addMonths(current, -1))}
                icon={ChevronLeft}
              />
              <IconButton
                label="Next month"
                onClick={() => setMonth((current) => addMonths(current, 1))}
                icon={ChevronRight}
              />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <div key={day} className="py-0.5">{day}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {days.map((item, index) => {
              if (item.blank) {
                return <div key={item.key} className="h-8 rounded-lg" />;
              }

              const day = item.day;
              const disabled = Boolean((min && day < startOfMonth(min) && !isSameDay(day, min)) || (max && day > max && !isSameDay(day, max)));
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, startOfToday());

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(day)}
                  className={cn(
                    'relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition',
                    isSelected
                      ? 'bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.24)]'
                      : disabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-[rgb(var(--text))] hover:bg-sky-50 hover:text-sky-700',
                    isToday && !isSelected && 'ring-1 ring-sky-300',
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-[rgb(var(--line)/0.08)] pt-2.5">
            <button
              type="button"
              className="text-xs font-medium text-sky-600 transition hover:text-sky-700"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                setOpen(false);
                onChange?.('');
              }}
              disabled={!clearable}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-medium text-sky-600 transition hover:text-sky-700"
              onClick={() => {
                const today = new Date();
                onChange?.(toDateValue(today));
                setMonth(startOfMonth(today));
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  placeholder = 'Select date and time',
  error,
  className = '',
}) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const current = useMemo(() => {
    if (!value) return { date: null, time: '09:00' };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: null, time: '09:00' };
    return {
      date: parsed,
      time: formatIndiaTime(parsed),
    };
  }, [value]);
  const [month, setMonth] = useState(() => startOfMonth(current.date || new Date()));
  const [time, setTime] = useState(current.time);
  const displayValue = current.date ? formatIndiaDateTime(current.date) : placeholder;

  useEffect(() => {
    if (current.date) {
      setMonth(startOfMonth(current.date));
      setTime(current.time);
    }
  }, [current.date, current.time]);

  useEffect(() => {
    function handleClickAway(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target) &&
        !(panelRef.current && panelRef.current.contains(event.target))
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('mousedown', handleClickAway);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !rootRef.current) return undefined;

    const updatePosition = () => {
      const anchor = rootRef.current.getBoundingClientRect();
      setPanelStyle(getPopoverStyle(anchor, Math.min(320, window.innerWidth - 16), 420));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  function commit(nextDate = current.date, nextTime = time) {
    if (!nextDate) {
      onChange?.('');
      return;
    }
    const normalizedTime = parseIndiaTimeInput(nextTime);
    if (!normalizedTime) return;
    onChange?.(toDateTimeValue(nextDate, normalizedTime));
  }

  return (
    <div ref={rootRef} className={cn('relative block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <button
        type="button"
        className="input flex min-h-[42px] items-center justify-between gap-3 text-left"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={cn('truncate', current.date ? 'text-[rgb(var(--text))]' : 'text-slate-400')}>
          {displayValue}
        </span>
        <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}

      {open && panelStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              className="z-[999] w-[min(18.5rem,calc(100vw-1rem))] overflow-auto rounded-[20px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.99)] p-2.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur"
              style={panelStyle}
            >
          <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--line)/0.08)] pb-2.5">
            <div className="text-xs font-semibold text-[rgb(var(--text))]">{format(month, 'MMMM yyyy')}</div>
            <div className="flex items-center gap-1">
              <IconButton
                label="Previous month"
                onClick={() => setMonth((currentMonth) => addMonths(currentMonth, -1))}
                icon={ChevronLeft}
              />
              <IconButton
                label="Next month"
                onClick={() => setMonth((currentMonth) => addMonths(currentMonth, 1))}
                icon={ChevronRight}
              />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <div key={day} className="py-0.5">{day}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {(() => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const firstWeekday = (monthStart.getDay() + 6) % 7;
              const blanks = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}`, blank: true }));
              const dates = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => ({ key: day.toISOString(), day }));
              return [...blanks, ...dates].map((item) => {
                if (item.blank) {
                  return <div key={item.key} className="h-8 rounded-lg" />;
                }

                const day = item.day;
                const isSelected = current.date ? isSameDay(day, current.date) : false;
                const isToday = isSameDay(day, startOfToday());

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      commit(day, time);
                    }}
                    className={cn(
                      'relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition',
                      isSelected
                        ? 'bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.24)]'
                        : 'text-[rgb(var(--text))] hover:bg-sky-50 hover:text-sky-700',
                      isToday && !isSelected && 'ring-1 ring-sky-300',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              });
            })()}
          </div>

          <div className="mt-2.5 grid gap-2.5 border-t border-[rgb(var(--line)/0.08)] pt-2.5 sm:grid-cols-[1fr_96px]">
            <label className="block">
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time</span>
              <input
                type="text"
                inputMode="text"
                placeholder="hh:mm AM"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                }}
                onBlur={() => {
                  if (current.date && parseIndiaTimeInput(time)) {
                    commit(current.date, time);
                  }
                }}
                className="input h-10"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center rounded-lg border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.7)] text-xs font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.92)]"
                onClick={() => {
                  const today = new Date();
                  setMonth(startOfMonth(today));
                  const nextTime = formatIndiaTime(today);
                  setTime(nextTime);
                  onChange?.(toDateTimeValue(today, nextTime));
                }}
              >
                Today
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-[rgb(var(--line)/0.08)] pt-2.5">
            <button
              type="button"
              className="text-xs font-medium text-sky-600 transition hover:text-sky-700"
              onClick={() => {
                onChange?.('');
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-medium text-sky-600 transition hover:text-sky-700"
              onClick={() => {
                if (current.date && parseIndiaTimeInput(time)) {
                  commit(current.date, time);
                  setOpen(false);
                }
              }}
            >
              Apply
            </button>
          </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function IconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.7)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.94)]"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
