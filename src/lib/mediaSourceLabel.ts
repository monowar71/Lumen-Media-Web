import i18n from '@/i18n';
import type { MediaSource, MediaStream } from '@/api/types';
import { formatBytes } from '@/lib/format';
import { fileNameFromPath } from '@/lib/mediaFile';

function primaryVideo(source: MediaSource): MediaStream | undefined {
  return source.streams.find((s) => s.kind === 'Video');
}

/** Map height to a common label (2160p, 1080p, …). */
export function resolutionLabel(width?: number, height?: number): string | undefined {
  if (!height || height <= 0) return undefined;
  if (height >= 2160 || (width != null && width >= 3840)) return '2160p';
  if (height >= 1440 || (width != null && width >= 2560)) return '1440p';
  if (height >= 1080 || (width != null && width >= 1920)) return '1080p';
  if (height >= 720 || (width != null && width >= 1280)) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  return `${height}p`;
}

function codecLabel(codec?: string): string | undefined {
  if (!codec) return undefined;
  const c = codec.toLowerCase();
  if (c === 'h264' || c === 'avc' || c === 'avc1') return 'H.264';
  if (c === 'hevc' || c === 'h265' || c === 'hvc1') return 'HEVC';
  if (c === 'av1' || c === 'av01') return 'AV1';
  if (c === 'vp9') return 'VP9';
  return codec.toUpperCase();
}

export type MediaSourceLabel = {
  /** Primary line — filename when known, otherwise technical summary. */
  title: string;
  /** Secondary line — container, size, bitrate, HDR, etc. */
  subtitle: string;
};

/** Build UI labels for a media source when choosing among multiple versions. */
export function mediaSourceLabel(source: MediaSource, index: number): MediaSourceLabel {
  const video = primaryVideo(source);
  const resolution = resolutionLabel(video?.width, video?.height);
  const codec = codecLabel(video?.codec);
  const technicalTitle = [resolution, codec].filter(Boolean).join(' · ');

  const fromPath = source.path
    ? fileNameFromPath(source.path, '')
    : '';
  const title =
    fromPath || technicalTitle || i18n.t('details:sourceVersion', { number: index + 1 });

  const parts: string[] = [];
  if (fromPath && technicalTitle) parts.push(technicalTitle);
  if (source.container) parts.push(source.container.toUpperCase());
  const size = formatBytes(source.sizeBytes);
  if (size) parts.push(size);
  if (source.overallBitrateKbps > 0) {
    const mbps = source.overallBitrateKbps / 1000;
    parts.push(mbps >= 10 ? `${Math.round(mbps)} Mbps` : `${Math.round(mbps * 10) / 10} Mbps`);
  }
  if (video?.hdr) parts.push(video.hdr);

  return { title, subtitle: parts.join(' · ') };
}
