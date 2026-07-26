import Hls from 'hls.js';
import type { PlaybackSource } from './playbackSource';
import { detectConnectionKind } from '@/lib/network';

export interface AttachOptions {
  accessToken?: string | null;
  /** Cap ABR to this bitrate (kbps). Applied via hls.js autoLevelCapping. */
  maxBitrateKbps?: number;
  onError?: (message: string) => void;
  onBuffering?: (buffering: boolean) => void;
}

export interface AttachHandle {
  destroy: () => void;
}

function withToken(url: string, token?: string | null): string {
  if (!token) return url;
  const u = new URL(url);
  u.searchParams.set('access_token', token);
  return u.toString();
}

function applyBitrateCap(hls: Hls, maxBitrateKbps?: number): void {
  if (!maxBitrateKbps || maxBitrateKbps <= 0 || maxBitrateKbps >= 100_000) {
    hls.autoLevelCapping = -1;
    return;
  }
  const maxBps = maxBitrateKbps * 1000;
  const levels = hls.levels;
  if (!levels?.length) return;
  let cap = -1;
  for (let i = 0; i < levels.length; i += 1) {
    if (levels[i].bitrate <= maxBps) cap = i;
  }
  hls.autoLevelCapping = cap;
}

function apiHostnameFromPage(): string | null {
  try {
    return typeof window !== 'undefined' ? window.location.hostname : null;
  } catch {
    return null;
  }
}

function buildHlsConfig(accessToken?: string | null): Partial<Hls['config']> {
  const lan = detectConnectionKind(apiHostnameFromPage()) === 'lan';
  // Chrome MSE SourceBuffer quotas are often ~100–150MB. Oversized caps cause
  // QuotaExceededError → hls.js reloads the same fragments in a tight loop.
  return {
    enableWorker: true,
    lowLatencyMode: false,
    maxBufferLength: lan ? 30 : 15,
    maxMaxBufferLength: lan ? 60 : 30,
    maxBufferSize: 40 * 1024 * 1024,
    maxBufferHole: 0.5,
    backBufferLength: 30,
    startFragPrefetch: false,
    testBandwidth: !lan,
    // EVENT playlists from ffmpeg -ss are VOD-like restarts, not true live.
    // Prefer VOD handling so scrubbing does not stick to the live edge.
    liveDurationInfinity: false,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: Infinity,
    manifestLoadingTimeOut: 30_000,
    levelLoadingTimeOut: 20_000,
    fragLoadingTimeOut: lan ? 20_000 : 60_000,
    manifestLoadingMaxRetry: 4,
    levelLoadingMaxRetry: 4,
    fragLoadingMaxRetry: 4,
    xhrSetup: (xhr) => {
      // Only Authorization — extra request headers force a CORS preflight that
      // can fail on stream GETs and freeze playback mid-seek.
      if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    },
  };
}

/**
 * Attaches a playback source to a <video> element. Always returns destroy().
 */
export function attachSource(
  video: HTMLVideoElement,
  source: PlaybackSource,
  opts: AttachOptions = {},
): AttachHandle {
  const { accessToken, maxBitrateKbps, onError, onBuffering } = opts;

  if (source.kind === 'direct') {
    return attachNative(video, withToken(source.url, accessToken), onBuffering);
  }

  if (Hls.isSupported()) {
    let networkRetries = 0;
    let mediaRetries = 0;
    const hls = new Hls(buildHlsConfig(accessToken));

    const onWaiting = () => onBuffering?.(true);
    const onPlaying = () => onBuffering?.(false);
    const onCanPlay = () => onBuffering?.(false);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);

    hls.on(Hls.Events.MANIFEST_PARSED, () => applyBitrateCap(hls, maxBitrateKbps));
    hls.on(Hls.Events.ERROR, (_event, data) => {
      // Shrink ahead-buffer on quota pressure instead of spinning on the same frags.
      if (data.details === Hls.ErrorDetails.BUFFER_FULL_ERROR) {
        const next = Math.max(8, Math.floor(hls.config.maxMaxBufferLength / 2));
        hls.config.maxMaxBufferLength = next;
        hls.config.maxBufferLength = Math.min(hls.config.maxBufferLength, next);
        if (!data.fatal) return;
      }

      if (!data.fatal) return;

      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          networkRetries += 1;
          if (networkRetries > 5) {
            onError?.(`Playback error: ${data.details}`);
            hls.destroy();
            break;
          }
          window.setTimeout(
            () => hls.startLoad(),
            Math.min(1000 * 2 ** (networkRetries - 1), 8000),
          );
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          mediaRetries += 1;
          // Circuit breaker: recoverMediaError() on a bad fMP4 fragment otherwise
          // hammers the same segment URLs thousands of times per minute.
          if (mediaRetries > 3) {
            onError?.(`Playback error: ${data.details}`);
            hls.destroy();
            break;
          }
          hls.recoverMediaError();
          break;
        default:
          onError?.(`Playback error: ${data.details}`);
          hls.destroy();
      }
    });

    hls.loadSource(withToken(source.url, accessToken));
    hls.attachMedia(video);
    return {
      destroy: () => {
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('canplay', onCanPlay);
        hls.destroy();
      },
    };
  }

  if (video.canPlayType('application/vnd.apple.mpegurl') !== '') {
    return attachNative(video, withToken(source.url, accessToken), onBuffering);
  }

  onError?.('HLS is not supported in this browser');
  return { destroy: () => {} };
}

function attachNative(
  video: HTMLVideoElement,
  url: string,
  onBuffering?: (buffering: boolean) => void,
): AttachHandle {
  const onWaiting = () => onBuffering?.(true);
  const onPlaying = () => onBuffering?.(false);
  const onCanPlay = () => onBuffering?.(false);
  video.addEventListener('waiting', onWaiting);
  video.addEventListener('playing', onPlaying);
  video.addEventListener('canplay', onCanPlay);
  video.src = url;
  return {
    destroy: () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
      video.removeAttribute('src');
      video.load();
    },
  };
}
