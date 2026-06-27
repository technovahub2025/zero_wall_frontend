import { cn } from '../../lib/utils';

export function GlobalFooter({ className }) {
  return (
    <a
      href="https://technovahub.in/"
      target="_blank"
      rel="noreferrer"
      className={cn(
        'block text-center text-xs leading-5 text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))] hover:underline',
        className,
      )}
      aria-label="Visit TechnovaHub"
    >
      &copy; 2026 TechnovaHub. All Rights Reserved.
    </a>
  );
}
