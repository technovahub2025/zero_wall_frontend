import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export function KanbanActionsMenu({
  items = [],
  className = '',
  triggerClassName = '',
  menuClassName = '',
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointer(event) {
      if (triggerRef.current?.contains?.(event.target)) return;
      if (menuRef.current?.contains?.(event.target)) return;
      setOpen(false);
    }

    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const menuItems = useMemo(() => items.filter(Boolean), [items]);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect?.();
    if (!rect) return;
    const width = 168;
    const height = menuItems.length * 44 + 12;
    const top = rect.bottom + height < window.innerHeight - 12 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
    const left = align === 'left' ? rect.left : Math.max(12, rect.right - width);
    setPosition({ top, left, width });
    setOpen(true);
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.92)] text-[rgb(var(--text))] shadow-sm transition hover:border-[rgb(var(--line)/0.24)] hover:bg-[rgb(var(--panel-2)/0.82)]',
          triggerClassName,
        )}
        aria-label="Open actions menu"
        onClick={(event) => {
          event.stopPropagation();
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && position && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className={cn(
                'fixed z-[80] overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.98)] p-1.5 text-[rgb(var(--text))] shadow-2xl shadow-slate-900/10 backdrop-blur-xl',
                menuClassName,
              )}
              style={{ top: position.top, left: position.left, width: position.width }}
            >
              <div className="grid gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key || item.label}
                      type="button"
                      disabled={item.disabled}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition',
                        item.tone === 'danger'
                          ? 'text-rose-500 hover:bg-rose-500/10'
                          : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.72)]',
                        item.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (item.disabled) return;
                        setOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {Icon ? <Icon className={cn('h-4 w-4', item.tone === 'danger' ? 'text-rose-500' : 'text-[rgb(var(--muted))]')} /> : null}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
