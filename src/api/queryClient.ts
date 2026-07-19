import { QueryClient } from '@tanstack/react-query';

/**
 * Sensible defaults per client_web/AGENTS.md resource discipline:
 * cache long enough to avoid duplicate requests, but not forever; do not
 * refetch on window focus for a media library (data changes slowly, pushed via
 * SignalR in a later phase); retry transient failures a couple of times.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
