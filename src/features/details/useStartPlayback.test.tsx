import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import * as api from '@/api/endpoints';
import { mockEpisodeDetail } from '@/mocks/data';
import { useStartPlayback } from './useStartPlayback';

vi.mock('@/api/endpoints', () => ({
  getEpisode: vi.fn(),
}));

const navigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => navigate,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('useStartPlayback', () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.mocked(api.getEpisode).mockReset();
  });

  it('navigates immediately when a single source is known', async () => {
    const { result } = renderHook(() => useStartPlayback(), { wrapper });

    await act(async () => {
      await result.current.start({
        mediaId: 'm1',
        title: 'One',
        resumeMs: 0,
        isEpisode: false,
        sources: [{ id: 'only', container: 'mkv', sizeBytes: 1, durationMs: 1, overallBitrateKbps: 1, streams: [] }],
      });
    });

    expect(navigate).toHaveBeenCalledWith('/watch/m1', {
      state: expect.objectContaining({ mediaSourceId: 'only' }),
    });
    expect(result.current.picker).toBeNull();
  });

  it('opens the picker when multiple sources are known', async () => {
    const { result } = renderHook(() => useStartPlayback(), { wrapper });
    const sources = mockEpisodeDetail['ep-bb-101'].mediaSources;

    await act(async () => {
      await result.current.start({
        mediaId: 'ep-bb-101',
        title: 'Pilot',
        resumeMs: 0,
        isEpisode: true,
        sources,
      });
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.picker?.sources).toHaveLength(2);

    act(() => result.current.selectSource('src-ep101-b'));
    expect(navigate).toHaveBeenCalledWith('/watch/ep-bb-101', {
      state: expect.objectContaining({ mediaSourceId: 'src-ep101-b' }),
    });
  });

  it('fetches episode detail and opens picker when sources are unknown', async () => {
    let resolveEpisode!: (value: (typeof mockEpisodeDetail)['ep-bb-101']) => void;
    vi.mocked(api.getEpisode).mockReturnValue(
      new Promise((resolve) => {
        resolveEpisode = resolve;
      }),
    );

    const { result } = renderHook(() => useStartPlayback(), { wrapper });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.start({
        mediaId: 'ep-bb-101',
        title: 'Pilot',
        resumeMs: 1000,
        isEpisode: true,
      });
    });

    expect(result.current.picker?.loading).toBe(true);
    expect(api.getEpisode).toHaveBeenCalledWith('ep-bb-101');

    await act(async () => {
      resolveEpisode(mockEpisodeDetail['ep-bb-101']);
      await pending;
    });

    expect(result.current.picker?.loading).toBe(false);
    expect(result.current.picker?.sources).toHaveLength(2);
    expect(navigate).not.toHaveBeenCalled();
  });
});
