import type { PlaybackDecisionResponse } from '@/api/types';
import { absoluteUrl } from '@/lib/artwork';

export type PlaybackSource =
  | { kind: 'direct'; url: string }
  | { kind: 'hls'; url: string };

/**
 * Maps a server playback decision to a concrete browser source.
 *
 * - DirectPlay  -> play the file URL directly via <video src> (byte-range).
 * - DirectStream/Transcode -> HLS. The server already returns the correct
 *   playlist for the mode (master.m3u8 for auto/ABR, index.m3u8 for a fixed
 *   quality), so we simply hand the URL to hls.js / native HLS.
 *
 * Pure and dependency-free so it can be unit-tested (docs/testing.md §5).
 */
export function resolvePlaybackSource(
  decision: PlaybackDecisionResponse,
  baseUrl: string,
  /** Bust browser/hls.js caches after ffmpeg restarts on the same session URL. */
  cacheToken?: string | number,
): PlaybackSource {
  let url = absoluteUrl(baseUrl, decision.streamUrl);
  if (decision.method === 'DirectPlay') {
    return { kind: 'direct', url };
  }
  if (cacheToken != null && cacheToken !== '') {
    const u = new URL(url);
    u.searchParams.set('_cp', String(cacheToken));
    url = u.toString();
  }
  return { kind: 'hls', url };
}
