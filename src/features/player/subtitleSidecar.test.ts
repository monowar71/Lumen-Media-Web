import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchSubtitleBlobUrl, showVideoTextTracks } from './subtitleSidecar';

describe('subtitleSidecar', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi\n', {
          status: 200,
          headers: { 'Content-Type': 'text/vtt' },
        }),
      ),
    );
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:mock-vtt'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches VTT with Authorization and returns a blob URL', async () => {
    const url = await fetchSubtitleBlobUrl('http://api.test', '/api/v1/items/x/subtitles/y.vtt', 'tok');
    expect(url).toBe('blob:mock-vtt');
    expect(fetch).toHaveBeenCalledWith(
      'http://api.test/api/v1/items/x/subtitles/y.vtt',
      expect.objectContaining({
        headers: { Authorization: 'Bearer tok' },
        credentials: 'omit',
      }),
    );
  });

  it('enables the only text track', () => {
    const track = { id: 'a', mode: 'disabled' as TextTrack['mode'] };
    const video = {
      textTracks: {
        length: 1,
        0: track,
        [Symbol.iterator]: function* () {
          yield track;
        },
      },
    } as unknown as HTMLVideoElement;
    showVideoTextTracks(video, 'a');
    expect(track.mode).toBe('showing');
  });
});
