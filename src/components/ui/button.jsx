import { cn } from '../../lib/utils';

export function Button({ className, variant = 'primary', size = 'md', asChild = false, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary: 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400',
    secondary: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-1 ring-[rgb(var(--line)/0.16)] hover:bg-[rgb(var(--panel-2)/0.94)]',
    ghost: 'bg-transparent text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.72)]',
    danger: 'bg-rose-500 text-[rgb(255_255_255)] hover:bg-rose-400',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };

  const Comp = asChild ? 'span' : 'button';
  return <Comp className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
