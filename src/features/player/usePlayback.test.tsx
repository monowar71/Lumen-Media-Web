import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePlayback } from './usePlayback';
import { authenticate } from '@/test/utils';

describe('usePlayback quality selector', () => {
  it('starts in Auto (master playlist) and switches to a fixed quality mid-playback', async () => {
    authenticate();

    const { result } = renderHook(() =>
      usePlayback({ itemId: 'movie-matrix', isEpisode: false, initialResumeMs: 0 }),
    );

    // Initial decision from POST /playback/decision.
    await waitFor(() => expect(result.current.decision).not.toBeNull());
    expect(result.current.decision?.method).toBe('Transcode');
    expect(result.current.selectedQualityId).toBe('auto');
    expect(result.current.decision?.streamUrl).toContain('master.m3u8');
    expect(result.current.selectedAudioId).toBe('strm-a1');

    // Provide a real <video> element so the re-attach path runs.
    act(() => {
      result.current.videoRef.current = document.createElement('video');
    });

    // Switching quality calls set-quality and swaps to a single index playlist.
    await act(async () => {
      await result.current.changeQuality('720p');
    });

    await waitFor(() => expect(result.current.selectedQualityId).toBe('720p'));
    expect(result.current.decision?.mode).toBe('manual');
    expect(result.current.decision?.streamUrl).toContain('index.m3u8');
  });

  it('switches the selected audio track via a new decision', async () => {
    authenticate();

    const { result } = renderHook(() =>
      usePlayback({ itemId: 'movie-matrix', isEpisode: false, initialResumeMs: 0 }),
    );

    await waitFor(() => expect(result.current.decision).not.toBeNull());
    act(() => {
      result.current.videoRef.current = document.createElement('video');
    });

    await act(async () => {
      await result.current.changeAudio('strm-a2');
    });

    await waitFor(() => expect(result.current.selectedAudioId).toBe('strm-a2'));
  });
});
