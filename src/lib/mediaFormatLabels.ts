import type { QualityOption } from '@/api/types';
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

export type PlaybackFormatPaths = {
  /** Source (or source→output) video summary for the player HUD. */
  videoLabel: string | null;
  /** Source (or source→output) audio summary for the player HUD. */
  audioLabel: string | null;
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
  const c = codec.toLowerCase().trim();
  if (!c || c === 'unknown' || c === 'und' || c === 'none') return undefined;
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
  if (!codec || codec === 'unknown' || codec === 'und' || codec === 'none') return undefined;
  return codec.toUpperCase();
}

/** Channel layout short label (5.1, 7.1, stereo). */
export function channelLayoutLabel(channels?: number): string | undefined {
  if (!channels || channels <= 0) return undefined;
  if (channels === 1) return 'Mono';
  if (channels === 2) return 'Stereo';
  if (channels === 3) return '2.1';
  if (channels === 6) return '5.1';
  if (channels === 8) return '7.1';
  return `${channels}ch`;
}

/** Ordered badges for the active video stream (resolution, HDR/SDR, codec). */
export function videoFormatBadges(
  info?: VideoFormatInfo | null,
  opts?: { includeSdr?: boolean },
): string[] {
  if (!info) return [];
  const badges: string[] = [];
  const res = resolutionLabel(info.width, info.height);
  if (res) badges.push(res);
  const hdr = hdrLabel(info.hdr);
  if (hdr) badges.push(hdr);
  else if (opts?.includeSdr) badges.push('SDR');
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

/** Compact "2160p · Dolby Vision · HEVC" summary for cards / HUD. */
export function videoFormatSummary(
  info?: VideoFormatInfo | null,
  opts?: { includeSdr?: boolean },
): string | null {
  const parts = videoFormatBadges(info, opts);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Compact "Dolby Digital+ · 5.1" summary for cards / HUD. */
export function audioFormatSummary(info?: AudioFormatInfo | null): string | null {
  const parts = audioFormatBadges(info);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Channel count for a playback audio-layout id (`stereo`, `5.1`, …). */
export function channelsForAudioLayout(layoutId?: string | null): number | undefined {
  if (!layoutId) return undefined;
  switch (layoutId.trim().toLowerCase()) {
    case 'mono':
      return 1;
    case 'stereo':
      return 2;
    case '2.1':
      return 3;
    case '5.1':
      return 6;
    case '7.1':
      return 8;
    default:
      return undefined;
  }
}

function joinArrow(from: string | null, to: string | null): string | null {
  if (from && to && from !== to) return `${from} → ${to}`;
  return to ?? from;
}

/**
 * Player HUD labels: on Transcode show source → output (H.264/AAC); otherwise source only.
 */
export function playbackFormatPaths(args: {
  method?: string | null;
  sourceVideo?: VideoFormatInfo | null;
  sourceAudio?: AudioFormatInfo | null;
  selectedQualityId?: string | null;
  availableQualities?: QualityOption[] | null;
  toneMapActive?: boolean;
  selectedAudioLayout?: string | null;
}): PlaybackFormatPaths {
  const method = args.method ?? '';
  const isTranscode = method === 'Transcode';
  const sourceVideoSummary = videoFormatSummary(args.sourceVideo);
  const sourceAudioSummary = audioFormatSummary(args.sourceAudio);

  if (!isTranscode) {
    return { videoLabel: sourceVideoSummary, audioLabel: sourceAudioSummary };
  }

  const quality = args.availableQualities?.find((q) => q.id === args.selectedQualityId);
  const outHeight = quality?.height ?? args.sourceVideo?.height;
  const outWidth = quality?.width ?? args.sourceVideo?.width;
  const hadHdr = Boolean(args.sourceVideo?.hdr) || Boolean(args.toneMapActive);
  const outputVideo: VideoFormatInfo = {
    codec: 'h264',
    hdr: null,
    width: outWidth,
    height: outHeight,
  };
  const outputAudio: AudioFormatInfo = {
    codec: 'aac',
    channels: channelsForAudioLayout(args.selectedAudioLayout) ?? 2,
  };

  return {
    videoLabel: joinArrow(
      sourceVideoSummary,
      videoFormatSummary(outputVideo, { includeSdr: hadHdr }),
    ),
    audioLabel: joinArrow(sourceAudioSummary, audioFormatSummary(outputAudio)),
  };
}

/** Format measured throughput for the player HUD (e.g. "12.4 Mbps"). */
export function formatNetworkMbps(bps: number | null | undefined): string | null {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return null;
  const mbps = bps / 1_000_000;
  if (mbps >= 100) return `${Math.round(mbps)} Mbps`;
  if (mbps >= 10) return `${Math.round(mbps * 10) / 10} Mbps`;
  return `${Math.round(mbps * 100) / 100} Mbps`;
}

export type TorrentStatsInfo = {
  seeders?: number;
  peers?: number;
  downloadSpeedBytesPerSec?: number;
};

/** Compact torrent HUD chip: "↓ 2.1 MB/s · 12↑ · 45 peers". */
export function formatTorrentStatsLabel(stats?: TorrentStatsInfo | null): string | null {
  if (!stats) return null;
  const parts: string[] = [];
  const speed = stats.downloadSpeedBytesPerSec ?? 0;
  if (speed > 0) {
    if (speed >= 1_000_000) parts.push(`↓ ${(speed / 1_000_000).toFixed(speed >= 10_000_000 ? 0 : 1)} MB/s`);
    else if (speed >= 1000) parts.push(`↓ ${Math.round(speed / 1000)} KB/s`);
    else parts.push(`↓ ${speed} B/s`);
  }
  parts.push(`${stats.seeders ?? 0}↑`);
  parts.push(`${stats.peers ?? 0} peers`);
  return parts.join(' · ');
}
