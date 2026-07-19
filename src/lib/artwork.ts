/**
 * Builds an absolute, correctly-sized artwork URL from a server-relative path.
 *
 * The server returns artwork paths like `/api/v1/items/<id>/artwork/Poster`
 * and supports on-the-fly resize via `?w=&h=&quality=` (api.md §6.6). We always
 * request the size we actually render so we never pull a 4K poster into a small
 * card (client_web/AGENTS.md resource discipline).
 */
export interface ArtworkSize {
  w?: number;
  h?: number;
  quality?: number;
  /** Device pixel ratio multiplier, capped to keep memory sane. */
  dpr?: number;
}

export function artworkUrl(
  baseUrl: string,
  path: string | undefined,
  size: ArtworkSize = {},
  token?: string | null,
): string | undefined {
  if (!path) return undefined;
  const dpr = Math.min(size.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1), 2);
  const absolute = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const url = new URL(absolute);
  if (size.w) url.searchParams.set('w', String(Math.round(size.w * dpr)));
  if (size.h) url.searchParams.set('h', String(Math.round(size.h * dpr)));
  url.searchParams.set('quality', String(size.quality ?? 80));
  // <img> cannot set an Authorization header; pass the short-lived token as a
  // query param (the server accepts it only on media-delivery routes).
  if (token) url.searchParams.set('access_token', token);
  return url.toString();
}

/** Absolute URL for a server-relative streaming/subtitle/download path. */
export function absoluteUrl(baseUrl: string, path: string): string {
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
}
