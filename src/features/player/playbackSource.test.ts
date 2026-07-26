import { describe, expect, it } from 'vitest';
import { resolvePlaybackSource } from './playbackSource';
import { decideForMedia } from '@/mocks/data';

const BASE = 'http://localhost:8096';

describe('playback decision -> source selection', () => {
  it('selects DirectPlay (video src) for a compatible source', () => {
    const decision = decideForMedia('movie-inception', 'auto', null, 0);
    expect(decision.method).toBe('DirectPlay');

    const source = resolvePlaybackSource(decision, BASE);
    expect(source.kind).toBe('direct');
    expect(source.url).toBe(`${BASE}/api/v1/items/movie-inception/download`);
  });

  it('selects HLS master playlist for Auto transcode (ABR)', () => {
    const decision = decideForMedia('movie-matrix', 'auto', null, 0);
    expect(decision.method).toBe('Transcode');
    expect(decision.selectedQualityId).toBe('auto');

    const source = resolvePlaybackSource(decision, BASE);
    expect(source.kind).toBe('hls');
    expect(source.url).toContain('/master.m3u8');
  });

  it('selects a single index playlist for a manual fixed quality', () => {
    const decision = decideForMedia('movie-matrix', 'manual', '720p', 754000);
    expect(decision.mode).toBe('manual');
    expect(decision.selectedQualityId).toBe('720p');
    expect(decision.startPositionMs).toBe(754000);

    const source = resolvePlaybackSource(decision, BASE);
    expect(source.kind).toBe('hls');
    expect(source.url).toContain('/index.m3u8');
  });

  it('exposes the quality ladder with Auto plus concrete rungs', () => {
    const decision = decideForMedia('movie-matrix', 'auto', null, 0);
    const ids = decision.availableQualities.map((q) => q.id);
    expect(ids).toContain('auto');
    expect(ids).toContain('1080p-high');
    expect(ids).toContain('1080p');
    expect(ids).toContain('720p');
    expect(ids).toContain('360p');
    expect(decision.availableQualities[0].adaptive).toBe(true);
  });

  it('cache-busts HLS URLs so seek restarts do not reuse a stale playlist', () => {
    const decision = decideForMedia('movie-matrix', 'auto', null, 120000);
    const source = resolvePlaybackSource(decision, BASE, '120000-3');
    expect(source.kind).toBe('hls');
    expect(source.url).toContain('_cp=120000-3');
  });
});
