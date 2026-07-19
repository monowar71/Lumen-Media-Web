/** Seek within locally available HLS media, else restart ffmpeg with -ss. */
export const SEEK_RESTART_SLACK_MS = 2_000;
/** If the scrub target is this far past the buffer, prefer ffmpeg -ss restart. */
export const SEEK_REMOTE_AHEAD_MS = 15_000;

function rangesContain(ranges: TimeRanges, t: number, slackSec: number): boolean {
  for (let i = 0; i < ranges.length; i += 1) {
    const start = ranges.start(i);
    const end = ranges.end(i);
    // HLS EVENT / live often reports seekable end as Infinity — never treat as local.
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (t >= start - slackSec && t <= end + slackSec) return true;
  }
  return false;
}

function bufferedEndSec(video: HTMLVideoElement): number {
  const { buffered } = video;
  let end = 0;
  for (let i = 0; i < buffered.length; i += 1) {
    const e = buffered.end(i);
    if (Number.isFinite(e)) end = Math.max(end, e);
  }
  return end;
}

/** True when the point is already in the media buffer (instant scrub). */
export function isInBuffered(video: HTMLVideoElement, relativeMs: number): boolean {
  const t = relativeMs / 1000;
  if (!Number.isFinite(t)) return false;
  return rangesContain(video.buffered, t, SEEK_RESTART_SLACK_MS / 1000);
}

/**
 * True when we should scrub via <video>.currentTime (in buffer, or a short gap
 * the HLS loader can fill). Far jumps restart ffmpeg with -ss instead — seeking
 * through hundreds of EVENT segments often stalls readyState at 1.
 */
export function canLocalSeek(video: HTMLVideoElement, relativeMs: number): boolean {
  const t = relativeMs / 1000;
  if (!Number.isFinite(t) || t < -SEEK_RESTART_SLACK_MS / 1000) return false;
  const slack = SEEK_RESTART_SLACK_MS / 1000;

  if (rangesContain(video.buffered, t, slack)) return true;

  // Allow a short look-ahead past the buffer if the playlist already lists it.
  const bufEnd = bufferedEndSec(video);
  const aheadMs = relativeMs - bufEnd * 1000;
  if (aheadMs > SEEK_REMOTE_AHEAD_MS) return false;

  if (rangesContain(video.seekable, t, slack)) return true;
  return false;
}
