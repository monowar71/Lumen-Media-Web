/** Router state passed to the player when starting playback from a detail view. */
export interface PlaybackNavState {
  title: string;
  mediaSourceId?: string;
  resumeMs: number;
  isEpisode: boolean;
  /** Optional backdrop path for a nicer player background. */
  backdrop?: string;
}

export function playerPath(itemId: string): string {
  return `/watch/${itemId}`;
}
