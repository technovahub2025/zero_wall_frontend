import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function DropdownField({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  selectedLabel,
  emptyValue = '',
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
  error = '',
}) {
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const activeLabel = useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (multiple) {
      const selectedOptions = options.filter((option) => Array.isArray(value) && value.some((item) => String(item) === String(option.value)));
      if (!Array.isArray(value) || value.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0]?.label || placeholder;
      if (selectedOptions.length > 1) return `${selectedOptions.length} selected`;
      return placeholder;
    }
    const current = options.find((option) => String(option.value) === String(value));
    return current?.label || placeholder;
  }, [multiple, options, placeholder, selectedLabel, value]);

  const visibleOptions = useMemo(() => {
    if (!searchable || !query.trim()) {
      return options;
    }

    const normalized = query.trim().toLowerCase();
    return options.filter((option) => {
      const label = String(option.label || '').toLowerCase();
      const valueLabel = String(option.value || '').toLowerCase();
      return label.includes(normalized) || valueLabel.includes(normalized);
    });
  }, [options, query, searchable]);

  const menuStyle = useMemo(() => {
    if (!rect || typeof window === 'undefined') return {};

    const gap = 6;
    const viewportPadding = 12;
    const searchHeight = searchable ? 58 : 0;
    const preferredListHeight = 256;
    const preferredHeight = searchHeight + preferredListHeight;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openAbove = spaceBelow < Math.min(preferredHeight, 220) && spaceAbove > spaceBelow;
    const availableHeight = Math.max(140, (openAbove ? spaceAbove : spaceBelow) - gap);
    const maxHeight = Math.min(preferredHeight, availableHeight);

    return {
      left: rect.left,
      top: openAbove ? Math.max(viewportPadding, rect.top - maxHeight - gap) : rect.bottom + gap,
      width: rect.width,
      maxHeight,
      listMaxHeight: Math.max(96, maxHeight - searchHeight),
    };
  }, [rect, searchable]);

  useEffect(() => {
    if (!open) return undefined;

    const updateRect = () => {
      if (!wrapRef.current) return;
      setRect(wrapRef.current.getBoundingClientRect());
    };
    updateRect();

    const onPointerDown = (event) => {
      const target = event.target;
      const clickedTrigger = wrapRef.current && wrapRef.current.contains(target);
      const clickedMenu = menuRef.current && menuRef.current.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menu =
    open && rect && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            data-dropdown-portal="true"
            className="fixed z-[130] overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.98)] text-[rgb(var(--text))] shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            style={{
              left: menuStyle.left,
              top: menuStyle.top,
              width: menuStyle.width,
              maxHeight: menuStyle.maxHeight,
            }}
          >
            <div className="border-b border-[rgb(var(--line)/0.12)] p-2">
              {searchable ? (
                <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.72)] px-3 py-2 text-sm text-[rgb(var(--text))]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    autoComplete="off"
                  />
                </label>
              ) : null}
            </div>
            <div className="scrollbar-none overflow-y-auto py-1" style={{ maxHeight: menuStyle.listMaxHeight }}>
              {multiple ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(options.map((option) => option.value));
                    }}
                      className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                      Array.isArray(value) && value.length === options.length
                        ? 'bg-sky-500/10 text-[rgb(var(--text))]'
                        : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.7)]',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{placeholder}</span>
                    {Array.isArray(value) && value.length === options.length ? <Check className="h-4 w-4 flex-shrink-0 text-sky-600" /> : null}
                  </button>
                  {visibleOptions.map((option) => {
                    const isActive = Array.isArray(value) && value.some((item) => String(item) === String(option.value));
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(value) ? value : [];
                          const exists = current.some((item) => String(item) === String(option.value));
                          const next = exists
                            ? current.filter((item) => String(item) !== String(option.value))
                            : [...current, option.value];
                          onChange(next);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                          isActive ? 'bg-sky-500/10 text-[rgb(var(--text))]' : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.7)]',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {isActive ? <Check className="h-4 w-4 flex-shrink-0 text-sky-600" /> : null}
                      </button>
                    );
                  })}
                  {!visibleOptions.length ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No matches found.</div>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(emptyValue);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                      String(value || '') === String(emptyValue || '')
                        ? 'bg-sky-500/10 text-sky-500'
                        : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.7)]',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{placeholder}</span>
                    {String(value || '') === String(emptyValue || '') ? <Check className="h-4 w-4 flex-shrink-0 text-sky-600" /> : null}
                  </button>
                  {visibleOptions.map((option) => {
                    const isActive = String(option.value) === String(value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                          isActive ? 'bg-sky-500/10 text-[rgb(var(--text))]' : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.7)]',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {isActive ? <Check className="h-4 w-4 flex-shrink-0 text-sky-600" /> : null}
                      </button>
                    );
                  })}
                  {!visibleOptions.length ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No matches found.</div>
                  ) : null}
                </>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-11 w-full items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.72)] px-4 text-left text-sm text-[rgb(var(--text))] shadow-sm transition hover:border-sky-400/30 hover:bg-[rgb(var(--panel-2)/0.92)]"
        >
          <span className="min-w-0 flex-1 truncate">{activeLabel}</span>
          <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
      {menu}
    </label>
  );
}
