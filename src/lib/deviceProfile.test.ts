import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildWebDeviceProfile,
  detectSupportsHdr,
  getCachedSupportsHdr,
  resetHdrProbeCache,
} from './deviceProfile';

describe('deviceProfile HDR', () => {
  afterEach(() => {
    resetHdrProbeCache();
    vi.unstubAllGlobals();
  });

  it('defaults supportsHdr to false when Media Capabilities is absent', async () => {
    vi.stubGlobal('navigator', { mediaCapabilities: undefined });
    await expect(detectSupportsHdr()).resolves.toBe(false);
    expect(getCachedSupportsHdr()).toBe(false);
  });

  it('buildWebDeviceProfile accepts an explicit supportsHdr override', () => {
    const profile = buildWebDeviceProfile({ maxBitrateKbps: 8000, supportsHdr: true });
    expect(profile.supportsHdr).toBe(true);
  });
});
