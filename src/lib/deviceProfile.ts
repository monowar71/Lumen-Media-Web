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
    supportsHdr: false,
  };
}
