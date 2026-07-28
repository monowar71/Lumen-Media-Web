import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MediaSource } from '@/api/types';
import * as api from '@/api/endpoints';
import { playerPath, type PlaybackNavState } from './playbackNav';

export type StartPlaybackRequest = {
  mediaId: string;
  title: string;
  resumeMs: number;
  isEpisode: boolean;
  backdrop?: string;
  /**
   * Known sources (e.g. movie detail). When omitted for an episode, sources are
   * loaded via GET /episodes/{id} before deciding whether to show the picker.
   */
  sources?: MediaSource[];
};

type PickerState = {
  request: StartPlaybackRequest;
  sources: MediaSource[];
  loading: boolean;
};

/**
 * Starts playback, prompting for a media source when several files exist
 * for the same movie/episode.
 */
export function useStartPlayback() {
  const navigate = useNavigate();
  const [picker, setPicker] = useState<PickerState | null>(null);

  const navigateToPlayer = useCallback(
    (request: StartPlaybackRequest, mediaSourceId?: string) => {
      const state: PlaybackNavState = {
        title: request.title,
        mediaSourceId,
        resumeMs: request.resumeMs,
        isEpisode: request.isEpisode,
        backdrop: request.backdrop,
      };
      navigate(playerPath(request.mediaId), { state });
    },
    [navigate],
  );

  const start = useCallback(
    async (request: StartPlaybackRequest) => {
      if (request.sources !== undefined) {
        if (request.sources.length > 1) {
          setPicker({ request, sources: request.sources, loading: false });
          return;
        }
        navigateToPlayer(request, request.sources[0]?.id);
        return;
      }

      // Episode list has no sources — resolve via detail endpoint.
      setPicker({ request, sources: [], loading: true });
      try {
        const detail = await api.getEpisode(request.mediaId);
        const sources = detail.mediaSources ?? [];
        if (sources.length > 1) {
          setPicker({ request, sources, loading: false });
          return;
        }
        setPicker(null);
        navigateToPlayer(request, sources[0]?.id);
      } catch {
        setPicker(null);
        navigateToPlayer(request);
      }
    },
    [navigateToPlayer],
  );

  const selectSource = useCallback(
    (sourceId: string) => {
      if (!picker) return;
      const { request } = picker;
      setPicker(null);
      navigateToPlayer(request, sourceId);
    },
    [picker, navigateToPlayer],
  );

  const cancelPicker = useCallback(() => setPicker(null), []);

  return {
    start,
    picker,
    selectSource,
    cancelPicker,
  };
}
