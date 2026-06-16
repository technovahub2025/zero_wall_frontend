import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Card } from '../ui/card';
import { useEffect } from 'react';

export function ModalShell({ title, description, onClose, children, widthClassName = 'max-w-4xl' }) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const dialog = (
    <div className="fixed inset-0 z-[60] m-0 flex items-end justify-center overflow-y-auto bg-slate-950/80 px-2 backdrop-blur-sm sm:items-start sm:px-4">
      <Card
        className={`theme-panel-raised m-0 mt-0 flex w-[calc(100vw-1rem)] ${widthClassName} max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] shadow-[0_32px_96px_rgba(15,23,42,0.35)] sm:w-full sm:max-h-[100vh] sm:rounded-[28px]`}
      >
        <div className="theme-divider flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
          <div>
            <div className="font-display text-lg font-semibold text-[rgb(var(--text))]">{title}</div>
            {description ? <div className="theme-muted-text mt-1 text-sm">{description}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-panel-muted rounded-2xl border p-2 shadow-sm transition hover:bg-[rgb(var(--panel-2)/0.92)]"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[rgb(var(--panel-2)/0.48)] px-4 py-4 sm:px-5">{children}</div>
      </Card>
    </div>
  );

  if (typeof document === 'undefined') {
    return dialog;
  }

  return createPortal(dialog, document.body);
}
