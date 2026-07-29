import type { DeviceProfile } from '@/api/types';

/**
 * Web device profile (client_web/AGENTS.md §Плеер).
 *
 * Browser HEVC / AC-3 support is unreliable in MSE (Chrome), so we probe the
 * actual `canPlayType` results and only advertise codecs the browser can play.
 */
function canPlay(type: string): boolean {
  if (typeof document === 'undefined') return false;
  const video = document.createElement('video');
  return video.canPlayType(type) !== '';
}

export function detectSupportsHevc(): boolean {
  return (
    canPlay('video/mp4; codecs="hvc1.1.6.L93.B0"') ||
    canPlay('video/mp4; codecs="hev1.1.6.L93.B0"')
  );
}

/**
 * Best-effort HDR decode probe via Media Capabilities (PQ / HLG).
 * Falls back to false when the API is missing or rejects the configs.
 */
export async function detectSupportsHdr(): Promise<boolean> {
  const mc = navigator.mediaCapabilities;
  if (!mc?.decodingInfo) return false;

  const codecs = [
    'hvc1.2.4.L153.B0',
    'hev1.2.4.L153.B0',
    'avc1.640028',
  ];
  const transfers = ['pq', 'hlg'] as const;

  for (const codec of codecs) {
    for (const transferFunction of transfers) {
      try {
        const result = await mc.decodingInfo({
          type: 'media-source',
          video: {
            contentType: `video/mp4; codecs="${codec}"`,
            width: 1920,
            height: 1080,
            bitrate: 8_000_000,
            framerate: 30,
            transferFunction,
          },
        } as MediaDecodingConfiguration);
        if (result.supported) return true;
      } catch {
        // Unsupported config shape — try the next combination.
      }
    }
  }
  return false;
}

let cachedSupportsHdr: boolean | null = null;
let hdrProbe: Promise<boolean> | null = null;

export function getCachedSupportsHdr(): boolean {
  return cachedSupportsHdr ?? false;
}

export async function ensureSupportsHdr(): Promise<boolean> {
  if (cachedSupportsHdr !== null) return cachedSupportsHdr;
  hdrProbe ??= detectSupportsHdr().then((v) => {
    cachedSupportsHdr = v;
    return v;
  });
  return hdrProbe;
}

/** Test helper — reset HDR probe cache. */
export function resetHdrProbeCache(): void {
  cachedSupportsHdr = null;
  hdrProbe = null;
}

export function detectWebAudioCodecs(): string[] {
  const codecs: string[] = ['aac'];
  if (canPlay('audio/mp4; codecs="ac-3"') || canPlay('audio/mp4; codecs="ac3"')) {
    codecs.push('ac3');
  }
  if (canPlay('audio/mp4; codecs="ec-3"') || canPlay('audio/mp4; codecs="eac3"')) {
    codecs.push('eac3');
  }
  if (canPlay('audio/webm; codecs="opus"') || canPlay('audio/ogg; codecs="opus"')) {
    codecs.push('opus');
  }
  return codecs;
}

export interface BuildProfileOptions {
  maxBitrateKbps: number;
  maxResolution?: string;
  /** Override HDR capability (defaults to last probe / false). */
  supportsHdr?: boolean;
}

export function buildWebDeviceProfile(options: BuildProfileOptions): DeviceProfile {
  const supportsHevc = detectSupportsHevc();
  const videoCodecs = ['h264'];
  if (supportsHevc) videoCodecs.push('hevc');

  return {
    maxResolution: options.maxResolution ?? '1080p',
    maxBitrateKbps: options.maxBitrateKbps,
    videoCodecs,
    audioCodecs: detectWebAudioCodecs(),
    containers: ['hls', 'mp4'],
    subtitleFormats: ['vtt', 'srt'],
    supportsHevc,
    supportsHdr: options.supportsHdr ?? getCachedSupportsHdr(),
  };
}
