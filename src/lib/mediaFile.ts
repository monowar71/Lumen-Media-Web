/** Absolute URL for `GET /api/v1/items/{id}/download` (query token for <a download>). */
export function downloadMediaUrl(
  baseUrl: string,
  mediaId: string,
  token?: string | null,
  sourceId?: string | null,
): string | undefined {
  if (!mediaId) return undefined;
  const absolute = `${baseUrl.replace(/\/$/, '')}/api/v1/items/${mediaId}/download`;
  const url = new URL(absolute);
  if (sourceId) url.searchParams.set('sourceId', sourceId);
  if (token) url.searchParams.set('access_token', token);
  return url.toString();
}

/** Sanitize a suggested download filename for the `download` attribute. */
export function sanitizeDownloadFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'video';
}

/** Basename of a server media path for download filenames. */
export function fileNameFromPath(path: string | undefined | null, fallback: string): string {
  if (!path) return fallback;
  const normalized = path.replace(/\\/g, '/');
  const base = normalized.slice(normalized.lastIndexOf('/') + 1).trim();
  return base || fallback;
}
