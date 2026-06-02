import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <section className={cn('glass-panel overflow-hidden rounded-[var(--radius)]', className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-wrap items-center gap-3 border-b border-[rgb(var(--line)/0.16)] px-4 py-4 sm:px-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-sm font-semibold tracking-wide text-[rgb(var(--text))] sm:text-base', className)} {...props} />;
}

export function CardBody({ className, ...props }) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />;
}
