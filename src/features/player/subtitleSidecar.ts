import { absoluteUrl } from '@/lib/artwork';

/**
 * Load a server WebVTT sidecar with Authorization (CORS-safe), then expose it as a
 * same-origin blob URL for a native <track>. Query-token track src often fails
 * silently under crossOrigin + MSE (hls.js).
 */
export async function fetchSubtitleBlobUrl(
  baseUrl: string,
  deliveryUrl: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<string> {
  const abs = absoluteUrl(baseUrl, deliveryUrl);
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(abs, { headers, signal, credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`Subtitle fetch failed: ${res.status}`);
  }
  const text = await res.text();
  if (!text.trim()) {
    throw new Error('Subtitle fetch returned empty body');
  }
  const blob = new Blob([text], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

/** Enable the sole (or matching) text track after a <track> finishes loading. */
export function showVideoTextTracks(video: HTMLVideoElement, preferId?: string | null): void {
  const tracks = video.textTracks;
  for (let i = 0; i < tracks.length; i += 1) {
    const track = tracks[i];
    const match =
      preferId == null ||
      preferId === '' ||
      track.id === preferId ||
      tracks.length === 1;
    track.mode = match ? 'showing' : 'disabled';
  }
}
