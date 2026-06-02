export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
