import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAmbientTheme } from './useAmbientTheme';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

class FakeAudio {
  static instances: FakeAudio[] = [];
  loop = false;
  volume = 1;
  preload = '';
  src = '';
  paused = true;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === 'src') this.src = '';
  });

  constructor(src?: string) {
    if (src) this.src = src;
    FakeAudio.instances.push(this);
  }
}

describe('useAmbientTheme', () => {
  const OriginalAudio = globalThis.Audio;

  beforeEach(() => {
    FakeAudio.instances = [];
    // @ts-expect-error test double
    globalThis.Audio = FakeAudio;
    useSettingsStore.setState({ baseUrl: 'http://server:8096' });
    useAuthStore.setState({ accessToken: 'tok' });
  });

  afterEach(() => {
    globalThis.Audio = OriginalAudio;
    vi.restoreAllMocks();
  });

  it('does nothing without themeUrl', () => {
    renderHook(() => useAmbientTheme(undefined));
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it('plays looping audio with access_token and cleans up on unmount', () => {
    const { unmount } = renderHook(() => useAmbientTheme('/api/v1/items/abc/theme'));
    expect(FakeAudio.instances).toHaveLength(1);
    const audio = FakeAudio.instances[0]!;
    expect(audio.loop).toBe(true);
    expect(audio.src).toContain('/api/v1/items/abc/theme');
    expect(audio.src).toContain('access_token=tok');
    expect(audio.play).toHaveBeenCalled();

    unmount();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
  });
});
