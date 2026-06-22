export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function resolveAppHref(href) {
  if (!href) return href;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href) || href.startsWith('//')) {
    return href;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (href.startsWith(normalizedBase) || href.startsWith(normalizedBase.slice(0, -1))) {
    return href;
  }

  if (href.startsWith('#')) {
    return `${normalizedBase}${href}`;
  }

  const normalizedHref = href.startsWith('/') ? href.slice(1) : href;
  return `${normalizedBase}${normalizedHref}`;
}
