import { cn } from '../../lib/utils';

export function Badge({ className, tone = 'slate', children }) {
  const tones = {
    slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
    blue: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
    green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
    rose: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1', tones[tone], className)}>
      {children}
    </span>
  );
}
