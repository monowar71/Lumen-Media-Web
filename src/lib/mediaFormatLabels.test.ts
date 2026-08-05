import { describe, expect, it } from 'vitest';
import {
  audioFormatBadges,
  audioFormatLabel,
  formatNetworkMbps,
  formatTorrentStatsLabel,
  hdrLabel,
  playbackFormatPaths,
  videoFormatBadges,
} from './mediaFormatLabels';

describe('mediaFormatLabels', () => {
  it('maps HDR variants', () => {
    expect(hdrLabel('HDR10')).toBe('HDR10');
    expect(hdrLabel('DolbyVision')).toBe('Dolby Vision');
    expect(hdrLabel('HLG')).toBe('HLG');
    expect(hdrLabel(null)).toBeUndefined();
  });

  it('detects Atmos and surround audio', () => {
    expect(audioFormatLabel({ codec: 'eac3', title: 'English Atmos', channels: 8 })).toBe(
      'Dolby Atmos',
    );
    expect(audioFormatLabel({ codec: 'truehd', channels: 8 })).toBe('Dolby TrueHD');
    expect(audioFormatLabel({ codec: 'eac3', channels: 6 })).toBe('Dolby Digital+');
    expect(audioFormatBadges({ codec: 'ac3', channels: 6 })).toEqual(['Dolby Digital', '5.1']);
  });

  it('builds video badges with resolution and HDR', () => {
    expect(
      videoFormatBadges({ codec: 'hevc', hdr: 'HDR10', width: 3840, height: 2160 }),
    ).toEqual(['2160p', 'HDR10', 'HEVC']);
  });

  it('formats network throughput', () => {
    expect(formatNetworkMbps(12_400_000)).toBe('12.4 Mbps');
    expect(formatNetworkMbps(0)).toBeNull();
    expect(formatNetworkMbps(null)).toBeNull();
  });

  it('shows source→output paths when transcoding', () => {
    const paths = playbackFormatPaths({
      method: 'Transcode',
      sourceVideo: { codec: 'hevc', hdr: 'DolbyVision', width: 3840, height: 2160 },
      sourceAudio: { codec: 'eac3', channels: 6 },
      selectedQualityId: '1080',
      availableQualities: [{ id: '1080', label: '1080p', width: 1920, height: 1080 }],
      toneMapActive: true,
      selectedAudioLayout: 'stereo',
    });
    expect(paths.videoLabel).toBe('2160p · Dolby Vision · HEVC → 1080p · SDR · H.264');
    expect(paths.audioLabel).toBe('Dolby Digital+ · 5.1 → AAC · Stereo');
  });

  it('hides unknown source codec on transcode', () => {
    const paths = playbackFormatPaths({
      method: 'Transcode',
      sourceVideo: { codec: 'unknown' },
      sourceAudio: { codec: 'unknown' },
      selectedQualityId: 'auto',
      availableQualities: [],
    });
    expect(paths.videoLabel).toBe('H.264');
    expect(paths.audioLabel).toBe('AAC · Stereo');
  });

  it('formats torrent stats for the player HUD', () => {
    expect(
      formatTorrentStatsLabel({
        seeders: 12,
        peers: 45,
        downloadSpeedBytesPerSec: 2_100_000,
      }),
    ).toBe('↓ 2.1 MB/s · 12↑ · 45 peers');
    expect(formatTorrentStatsLabel({ seeders: 0, peers: 0, downloadSpeedBytesPerSec: 0 })).toBe(
      '0↑ · 0 peers',
    );
    expect(formatTorrentStatsLabel(null)).toBeNull();
  });

  it('keeps source-only labels for Direct Play', () => {
    const paths = playbackFormatPaths({
      method: 'DirectPlay',
      sourceVideo: { codec: 'h264', width: 1920, height: 1080 },
      sourceAudio: { codec: 'aac', channels: 2 },
    });
    expect(paths.videoLabel).toBe('1080p · H.264');
    expect(paths.audioLabel).toBe('AAC · Stereo');
  });
});
