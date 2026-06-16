import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useUiStore } from '../../store/uiStore';

export function ConfirmModal() {
  const { confirmState, closeConfirm } = useUiStore();

  if (!confirmState.open) return null;

  async function handleConfirm() {
    try {
      await confirmState.onConfirm?.();
    } finally {
      closeConfirm();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4">
      <Card className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--line)/0.16)] px-4 py-4 sm:px-5">
          <div>
            <div className="font-display text-lg font-semibold text-[rgb(var(--text))]">{confirmState.title}</div>
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">{confirmState.message}</div>
          </div>
          <button
            type="button"
            onClick={closeConfirm}
            className="rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] p-2 text-[rgb(var(--text))]"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
          <Button variant="secondary" onClick={closeConfirm}>
            {confirmState.cancelLabel}
          </Button>
          <Button variant={confirmState.tone === 'rose' ? 'danger' : 'primary'} onClick={handleConfirm}>
            {confirmState.confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
