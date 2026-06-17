import { AlertCircle } from 'lucide-react';

export function SubmitErrorAlert({ title = 'Could not save', message, className = '' }) {
  if (!message) return null;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 ${className}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-sm text-rose-500">{message}</div>
      </div>
    </div>
  );
}
