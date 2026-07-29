import { describe, expect, it } from 'vitest';
import {
  audioFormatBadges,
  audioFormatLabel,
  formatNetworkMbps,
  hdrLabel,
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
});
