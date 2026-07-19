import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as api from './endpoints';
import type { LibraryItemsQuery } from './endpoints';
import type { ProgressRequest, UpdateItemMetadataRequest } from './types';

export const queryKeys = {
  serverInfo: ['serverInfo'] as const,
  me: ['me'] as const,
  libraries: ['libraries'] as const,
  library: (id: string) => ['library', id] as const,
  libraryItems: (id: string, query: Omit<LibraryItemsQuery, 'page' | 'cursor'>) =>
    ['libraryItems', id, query] as const,
  item: (id: string) => ['item', id] as const,
  seasons: (seriesId: string) => ['seasons', seriesId] as const,
  episodes: (seasonId: string) => ['episodes', seasonId] as const,
  episode: (id: string) => ['episode', id] as const,
  home: ['home'] as const,
  continueWatching: ['continueWatching'] as const,
  history: ['history'] as const,
  progress: (itemId: string) => ['progress', itemId] as const,
  search: (q: string) => ['search', q] as const,
  users: ['users'] as const,
  serverSettings: ['serverSettings'] as const,
  jobs: ['jobs'] as const,
  job: (id: string) => ['job', id] as const,
  imports: ['imports'] as const,
  matchCandidates: (id: string, q: string, year?: number) =>
    ['matchCandidates', id, q, year ?? null] as const,
};

export function useLibraries() {
  return useQuery({ queryKey: queryKeys.libraries, queryFn: api.getLibraries });
}

export function useLibrary(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.library(id ?? ''),
    queryFn: () => api.getLibrary(id!),
    enabled: Boolean(id),
  });
}

const PAGE_SIZE = 40;

export function useLibraryItems(id: string | undefined, query: Omit<LibraryItemsQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.libraryItems(id ?? '', query),
    enabled: Boolean(id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.getLibraryItems(id!, { ...query, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.item(id ?? ''),
    queryFn: () => api.getItem(id!),
    enabled: Boolean(id),
  });
}

export function useSeasons(seriesId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.seasons(seriesId ?? ''),
    queryFn: () => api.getSeasons(seriesId!),
    enabled: Boolean(seriesId),
  });
}

export function useEpisodes(seasonId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.episodes(seasonId ?? ''),
    queryFn: () => api.getEpisodes(seasonId!),
    enabled: Boolean(seasonId),
  });
}

export function useHome() {
  return useQuery({ queryKey: queryKeys.home, queryFn: api.getHome });
}

const HISTORY_PAGE_SIZE = 40;

export function useHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getHistory(pageParam, HISTORY_PAGE_SIZE),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.clearHistory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.history });
      void qc.invalidateQueries({ queryKey: queryKeys.continueWatching });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
      void qc.invalidateQueries({ queryKey: ['libraryItems'] });
      void qc.invalidateQueries({ queryKey: ['item'] });
    },
  });
}

export function useImportPlexHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.importPlexHistory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.history });
      void qc.invalidateQueries({ queryKey: queryKeys.continueWatching });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
      void qc.invalidateQueries({ queryKey: ['libraryItems'] });
      void qc.invalidateQueries({ queryKey: ['item'] });
    },
  });
}

export function useProgress(itemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progress(itemId ?? ''),
    queryFn: () => api.getProgress(itemId!),
    enabled: Boolean(itemId),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: () => api.search(q),
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });
}

export function useProgressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: ProgressRequest }) =>
      api.putProgress(itemId, body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.progress(data.itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.continueWatching });
      qc.invalidateQueries({ queryKey: queryKeys.history });
      qc.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

/** Mark movie / episode / season / series watched or unwatched. */
export function useMarkWatchedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, watched }: { itemId: string; watched: boolean }) =>
      api.putProgress(itemId, { watched }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.progress(vars.itemId) });
      void qc.invalidateQueries({ queryKey: queryKeys.item(vars.itemId) });
      void qc.invalidateQueries({ queryKey: queryKeys.episodes(vars.itemId) });
      void qc.invalidateQueries({ queryKey: ['episodes'] });
      void qc.invalidateQueries({ queryKey: ['item'] });
      void qc.invalidateQueries({ queryKey: ['libraryItems'] });
      void qc.invalidateQueries({ queryKey: queryKeys.continueWatching });
      void qc.invalidateQueries({ queryKey: queryKeys.history });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

export function useCreateLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createLibrary,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.libraries });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

export function useScanLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.scanLibrary(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.libraries });
      void qc.invalidateQueries({ queryKey: queryKeys.library(id) });
      void qc.invalidateQueries({ queryKey: ['libraryItems', id] });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

export function useRefreshLibraryMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: Parameters<typeof api.refreshLibraryMetadata>[1];
    }) => api.refreshLibraryMetadata(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.libraries });
      void qc.invalidateQueries({ queryKey: queryKeys.library(id) });
      void qc.invalidateQueries({ queryKey: ['libraryItems', id] });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useDeleteLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteLibrary(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.libraries });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.getUsers });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useServerSettings() {
  return useQuery({ queryKey: queryKeys.serverSettings, queryFn: api.getServerSettings });
}

export function useSaveServerSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.putServerSettings,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.serverSettings }),
  });
}

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => api.getJobs(),
    refetchInterval: 15_000,
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelJob(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useImports() {
  return useQuery({
    queryKey: queryKeys.imports,
    queryFn: () => api.getImports(),
  });
}

export function useRefreshMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.refreshMetadata(itemId),
    onSuccess: (_job, itemId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.item(itemId) });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

export function useMatchCandidates(
  itemId: string | undefined,
  q: string,
  year: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.matchCandidates(itemId ?? '', q, year),
    queryFn: () => api.getMatchCandidates(itemId!, q, year),
    enabled: Boolean(itemId) && enabled && q.trim().length > 0,
  });
}

export function useMatchItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      provider,
      providerId,
    }: {
      itemId: string;
      provider: string;
      providerId: string;
    }) => api.matchItem(itemId, { provider, providerId }),
    onSuccess: (_job, { itemId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.item(itemId) });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
      // Job applies asynchronously — refresh again shortly.
      window.setTimeout(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.item(itemId) });
      }, 2500);
    },
  });
}

export function useUpdateItemMetadata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: UpdateItemMetadataRequest }) =>
      api.updateItemMetadata(itemId, body),
    onSuccess: (_data, { itemId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.item(itemId) });
      void qc.invalidateQueries({ queryKey: queryKeys.home });
      void qc.invalidateQueries({ queryKey: ['libraryItems'] });
    },
  });
}
