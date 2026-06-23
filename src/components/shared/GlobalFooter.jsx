import { cn } from '../../lib/utils';

export function GlobalFooter({ className }) {
  return (
    <p className={cn('text-center text-xs leading-5 text-[rgb(var(--muted))]', className)}>
      © 2026 TechnovaHub. All Rights Reserved.
    </p>
  );
}
