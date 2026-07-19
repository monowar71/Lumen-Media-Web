import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries';
import type { JobProgressEvent, LibraryUpdatedEvent, PlaybackSyncEvent } from './types';

let connection: HubConnection | null = null;

/**
 * Connects to /hubs/notifications with the JWT as access_token (api.md §8).
 * Invalidates TanStack Query caches on LibraryUpdated / JobProgress / PlaybackSync.
 */
export async function startRealtime(
  baseUrl: string,
  accessToken: string,
  queryClient: QueryClient,
): Promise<void> {
  await stopRealtime();

  const hubUrl = `${baseUrl.replace(/\/+$/, '')}/hubs/notifications`;
  connection = new HubConnectionBuilder()
    .withUrl(hubUrl, { accessTokenFactory: () => accessToken })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on('LibraryUpdated', (payload: LibraryUpdatedEvent) => {
    const libraryId = payload.libraryId;
    void queryClient.invalidateQueries({ queryKey: queryKeys.libraries });
    void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    if (libraryId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.library(libraryId) });
      void queryClient.invalidateQueries({ queryKey: ['libraryItems', libraryId] });
    }
  });

  connection.on('JobProgress', (payload: JobProgressEvent) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    if (payload.job?.id) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(payload.job.id) });
    }
  });

  connection.on('PlaybackSync', (payload: PlaybackSyncEvent) => {
    if (payload.itemId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress(payload.itemId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.item(payload.itemId) });
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    void queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching });
  });

  connection.on('NowPlaying', () => {
    /* admin panel can subscribe later; no cache action required for viewers */
  });

  try {
    await connection.start();
  } catch (err) {
    console.warn('[signalr] failed to connect', err);
  }
}

export async function stopRealtime(): Promise<void> {
  if (!connection) return;
  const current = connection;
  connection = null;
  try {
    if (current.state !== HubConnectionState.Disconnected) await current.stop();
  } catch {
    /* ignore */
  }
}

export async function subscribeJob(jobId: string): Promise<void> {
  if (connection?.state === HubConnectionState.Connected) {
    await connection.invoke('SubscribeJob', jobId);
  }
}

export async function unsubscribeJob(jobId: string): Promise<void> {
  if (connection?.state === HubConnectionState.Connected) {
    await connection.invoke('UnsubscribeJob', jobId);
  }
}
