import { describe, expect, it } from 'vitest';
import { canLocalSeek, isInBuffered, SEEK_REMOTE_AHEAD_MS, SEEK_RESTART_SLACK_MS } from './seekHelpers';

function fakeVideo(ranges: Array<[number, number]>, seekable?: Array<[number, number]>) {
  const mk = (list: Array<[number, number]>) =>
    ({
      length: list.length,
      start: (i: number) => list[i][0],
      end: (i: number) => list[i][1],
    }) as TimeRanges;

  return {
    buffered: mk(ranges),
    seekable: mk(seekable ?? ranges),
  } as HTMLVideoElement;
}

describe('canLocalSeek', () => {
  it('allows seeks inside a finite buffered range', () => {
    const video = fakeVideo([[0, 12]]);
    expect(canLocalSeek(video, 5_000)).toBe(true);
    expect(isInBuffered(video, 5_000)).toBe(true);
  });

  it('allows short look-ahead within seekable', () => {
    const video = fakeVideo([[0, 4]], [[0, 120]]);
    expect(isInBuffered(video, 10_000)).toBe(false);
    expect(canLocalSeek(video, 10_000)).toBe(true);
  });

  it('forces remote restart for long jumps past the buffer', () => {
    const video = fakeVideo([[0, 4]], [[0, 600]]);
    expect(canLocalSeek(video, 4_000 + SEEK_REMOTE_AHEAD_MS + 1)).toBe(false);
    expect(canLocalSeek(video, 300_000)).toBe(false);
  });

  it('rejects seeks past the seekable edge', () => {
    const video = fakeVideo([[0, 12]]);
    expect(canLocalSeek(video, 12_000 + SEEK_RESTART_SLACK_MS + 1)).toBe(false);
  });

  it('ignores infinite seekable ends (HLS EVENT live quirk)', () => {
    const video = fakeVideo([[0, 8]], [[0, Number.POSITIVE_INFINITY]]);
    expect(canLocalSeek(video, 4_000)).toBe(true);
    expect(canLocalSeek(video, 120_000)).toBe(false);
  });
});
