import i18n from '@/i18n';
import type { MediaSource, MediaStream } from '@/api/types';
import { formatBytes } from '@/lib/format';
import {
  audioFormatSummary,
  videoFormatSummary,
  type AudioFormatInfo,
  type VideoFormatInfo,
} from '@/lib/mediaFormatLabels';
import { fileNameFromPath } from '@/lib/mediaFile';

function primaryVideo(source: MediaSource): MediaStream | undefined {
  return source.streams.find((s) => s.kind === 'Video');
}

function primaryAudio(source: MediaSource): MediaStream | undefined {
  return (
    source.streams.find((s) => s.kind === 'Audio' && s.isDefault) ??
    source.streams.find((s) => s.kind === 'Audio')
  );
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

export type MediaSourceLabel = {
  /** Primary line — filename when known, otherwise technical summary. */
  title: string;
  /** Secondary line — container, size, bitrate. */
  subtitle: string;
  /** Source video format (e.g. "2160p · Dolby Vision · HEVC"). */
  video: string | null;
  /** Source audio format (e.g. "Dolby Digital+ · 5.1"). */
  audio: string | null;
  /** Extra audio tracks beyond the primary (0 when only one). */
  extraAudioTracks: number;
};

function videoInfoFromStream(video?: MediaStream): VideoFormatInfo | null {
  if (!video) return null;
  return {
    codec: video.codec,
    hdr: video.hdr,
    width: video.width,
    height: video.height,
  };
}

function audioInfoFromStream(audio?: MediaStream): AudioFormatInfo | null {
  if (!audio) return null;
  return {
    codec: audio.codec,
    channels: audio.channels,
    title: audio.title,
  };
}

/** Build UI labels for a media source when choosing among multiple versions. */
export function mediaSourceLabel(source: MediaSource, index: number): MediaSourceLabel {
  const video = primaryVideo(source);
  const audio = primaryAudio(source);
  const videoLine = videoFormatSummary(videoInfoFromStream(video));
  const audioLine = audioFormatSummary(audioInfoFromStream(audio));
  const audioCount = source.streams.filter((s) => s.kind === 'Audio').length;
  const technicalTitle = [videoLine, audioLine].filter(Boolean).join(' · ');

  const fromPath = source.path ? fileNameFromPath(source.path, '') : '';
  const title =
    fromPath || technicalTitle || i18n.t('details:sourceVersion', { number: index + 1 });

  const parts: string[] = [];
  if (source.container) parts.push(source.container.toUpperCase());
  const size = formatBytes(source.sizeBytes);
  if (size) parts.push(size);
  if (source.overallBitrateKbps > 0) {
    const mbps = source.overallBitrateKbps / 1000;
    parts.push(mbps >= 10 ? `${Math.round(mbps)} Mbps` : `${Math.round(mbps * 10) / 10} Mbps`);
  }

  return {
    title,
    subtitle: parts.join(' · '),
    video: videoLine,
    audio: audioLine,
    extraAudioTracks: Math.max(0, audioCount - 1),
  };
}
