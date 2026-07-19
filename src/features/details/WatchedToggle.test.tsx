import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useMarkWatchedMutation } from '@/api/queries';
import * as api from '@/api/endpoints';

vi.mock('@/api/endpoints', () => ({
  putProgress: vi.fn(),
}));

describe('useMarkWatchedMutation', () => {
  beforeEach(() => {
    vi.mocked(api.putProgress).mockReset();
  });

  it('sends watched flag and invalidates related queries', async () => {
    vi.mocked(api.putProgress).mockResolvedValue({
      itemId: 'm1',
      positionMs: 0,
      watched: true,
      updatedAt: new Date().toISOString(),
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useMarkWatchedMutation(), { wrapper });
    result.current.mutate({ itemId: 'm1', watched: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.putProgress).toHaveBeenCalledWith('m1', { watched: true });
    expect(invalidate).toHaveBeenCalled();
  });
});
