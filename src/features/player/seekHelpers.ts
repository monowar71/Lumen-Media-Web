/** Seek within locally buffered HLS media, else restart ffmpeg with -ss. */
export const SEEK_RESTART_SLACK_MS = 2_000;

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

/** True when the point is already in the media buffer (instant scrub). */
export function isInBuffered(video: HTMLVideoElement, relativeMs: number): boolean {
  const t = relativeMs / 1000;
  if (!Number.isFinite(t)) return false;
  return rangesContain(video.buffered, t, SEEK_RESTART_SLACK_MS / 1000);
}

/**
 * True when we should scrub via <video>.currentTime.
 *
 * Only the MSE buffer is trusted. HLS EVENT seekable ranges often extend past
 * fragments ffmpeg has actually finished — seeking there stalls readyState and
 * freezes the player until a remote -ss restart. Far jumps always restart.
 */
export function canLocalSeek(video: HTMLVideoElement, relativeMs: number): boolean {
  return isInBuffered(video, relativeMs);
}
