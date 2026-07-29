import { resolutionLabel } from '@/lib/mediaSourceLabel';

export type VideoFormatInfo = {
  codec?: string;
  hdr?: string | null;
  width?: number;
  height?: number;
};

export type AudioFormatInfo = {
  codec?: string;
  channels?: number;
  title?: string | null;
};

/** Human-readable HDR / Dolby Vision label from probe metadata. */
export function hdrLabel(hdr?: string | null): string | undefined {
  if (!hdr) return undefined;
  const h = hdr.trim();
  if (!h) return undefined;
  const lower = h.toLowerCase();
  if (lower === 'dolbyvision' || lower === 'dolby vision' || lower === 'dv') {
    return 'Dolby Vision';
  }
  if (lower === 'hdr10+') return 'HDR10+';
  if (lower === 'hdr10') return 'HDR10';
  if (lower === 'hlg') return 'HLG';
  return h;
}

function videoCodecLabel(codec?: string): string | undefined {
  if (!codec) return undefined;
  const c = codec.toLowerCase();
  if (c === 'h264' || c === 'avc' || c === 'avc1') return 'H.264';
  if (c === 'hevc' || c === 'h265' || c === 'hvc1') return 'HEVC';
  if (c === 'av1' || c === 'av01') return 'AV1';
  if (c === 'vp9') return 'VP9';
  return codec.toUpperCase();
}

/** True when stream title/codec hints at Dolby Atmos. */
export function isAtmosAudio(info: AudioFormatInfo): boolean {
  const title = (info.title ?? '').toLowerCase();
  if (title.includes('atmos')) return true;
  const codec = (info.codec ?? '').toLowerCase();
  return (codec === 'truehd' || codec === 'eac3' || codec === 'ec-3') && title.includes('joc');
}

/** Compact audio format badge (Atmos, TrueHD, DD+, DTS-HD, …). */
export function audioFormatLabel(info: AudioFormatInfo): string | undefined {
  if (isAtmosAudio(info)) return 'Dolby Atmos';
  const codec = (info.codec ?? '').toLowerCase();
  const title = (info.title ?? '').toLowerCase();
  if (title.includes('dts:x') || title.includes('dts-x')) return 'DTS:X';
  if (codec === 'truehd') return 'Dolby TrueHD';
  if (codec === 'eac3' || codec === 'ec-3') return 'Dolby Digital+';
  if (codec === 'ac3' || codec === 'ac-3') return 'Dolby Digital';
  if (codec.includes('dts') && (codec.includes('hd') || title.includes('hd ma'))) return 'DTS-HD';
  if (codec === 'dts') return 'DTS';
  if (codec === 'flac') return 'FLAC';
  if (codec === 'opus') return 'Opus';
  if (codec === 'aac' || codec === 'mp4a') return 'AAC';
  if (codec === 'pcm' || codec.startsWith('pcm_')) return 'PCM';
  if (!codec) return undefined;
  return codec.toUpperCase();
}

/** Channel layout short label (5.1, 7.1, stereo). */
export function channelLayoutLabel(channels?: number): string | undefined {
  if (!channels || channels <= 0) return undefined;
  if (channels === 1) return 'Mono';
  if (channels === 2) return 'Stereo';
  if (channels === 6) return '5.1';
  if (channels === 8) return '7.1';
  return `${channels}ch`;
}

/** Ordered badges for the active video stream (resolution, HDR, codec). */
export function videoFormatBadges(info?: VideoFormatInfo | null): string[] {
  if (!info) return [];
  const badges: string[] = [];
  const res = resolutionLabel(info.width, info.height);
  if (res) badges.push(res);
  const hdr = hdrLabel(info.hdr);
  if (hdr) badges.push(hdr);
  const codec = videoCodecLabel(info.codec);
  if (codec) badges.push(codec);
  return badges;
}

/** Ordered badges for the active audio stream (format + layout). */
export function audioFormatBadges(info?: AudioFormatInfo | null): string[] {
  if (!info) return [];
  const badges: string[] = [];
  const format = audioFormatLabel(info);
  if (format) badges.push(format);
  // Atmos already implies a surround layout — skip redundant channel badge.
  if (!isAtmosAudio(info)) {
    const layout = channelLayoutLabel(info.channels);
    if (layout) badges.push(layout);
  }
  return badges;
}

/** Format measured throughput for the player HUD (e.g. "12.4 Mbps"). */
export function formatNetworkMbps(bps: number | null | undefined): string | null {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return null;
  const mbps = bps / 1_000_000;
  if (mbps >= 100) return `${Math.round(mbps)} Mbps`;
  if (mbps >= 10) return `${Math.round(mbps * 10) / 10} Mbps`;
  return `${Math.round(mbps * 100) / 100} Mbps`;
}
