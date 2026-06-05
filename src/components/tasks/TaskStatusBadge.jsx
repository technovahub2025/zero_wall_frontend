import { Badge } from '../ui/badge';

export function TaskStatusBadge({ value }) {
  const normalized = String(value || '').toLowerCase();
  const tone = normalized === 'done'
    ? 'green'
    : normalized === 'in-progress'
      ? 'blue'
      : normalized === 'review'
        ? 'amber'
        : normalized === 'blocked'
          ? 'rose'
          : 'slate';
  const label = normalized === 'done'
    ? 'Done'
    : normalized === 'in-progress'
      ? 'In Progress'
      : normalized === 'review'
        ? 'In Review'
        : normalized === 'blocked'
          ? 'Blocked'
          : normalized === 'todo'
            ? 'Todo'
            : formatCustomStatus(value);
  return <Badge tone={tone}>{label}</Badge>;
}

function formatCustomStatus(value) {
  const text = String(value || '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!text) return 'Todo';
  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
