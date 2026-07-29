/** True when the item can be cleared back to unwatched (fully watched or in-progress). */
export function canMarkUnwatched(watched?: boolean, playbackPositionMs?: number): boolean {
  return Boolean(watched) || (playbackPositionMs ?? 0) > 0;
}
