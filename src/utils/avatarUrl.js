export function buildAvatarUrl(src, version) {
  if (!src) return '';

  const versionValue = version instanceof Date ? version.getTime() : version;
  if (!versionValue) return src;

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}v=${encodeURIComponent(String(versionValue))}`;
}
