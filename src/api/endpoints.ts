import { http } from './http';
import type {
  EpisodeDetail,
  EpisodeSummary,
  HomeResponse,
  ItemDetail,
  CreateLibraryRequest,
  LibraryDto,
  LibraryMetadataRefreshAccepted,
  LoginRequest,
  RefreshLibraryMetadataRequest,
  UpdateLibraryRequest,
  LoginResponse,
  ScanJobAccepted,
  MediaItemSummary,
  PagedResult,
  PlaybackDecisionRequest,
  PlaybackDecisionResponse,
  ProgressRequest,
  ProgressResponse,
  RefreshRequest,
  RefreshResponse,
  Season,
  SearchResponse,
  ServerInfo,
  ServerSettingsDto,
  SetupRequest,
  SetupResponse,
  SetQualityRequest,
  CreateUserRequest,
  UpdateUserRequest,
  JobDto,
  ImportJobDto,
  UserDto,
  MetadataMatchCandidateDto,
  UpdateItemMetadataRequest,
  ArtworkCandidateDto,
  ArtworkKindParam,
  SetItemArtworkRequest,
  HistoryEntry,
  ClearHistoryResponse,
  DeleteMediaFileResponse,
  ImportPlexHistoryRequest,
  ImportPlexHistoryResponse,
} from './types';

const API = '/api/v1';

// --- Server / auth ---
export function getServerInfo(baseUrl?: string) {
  return http
    .get<ServerInfo>(`${API}/server/info`, baseUrl ? { baseURL: baseUrl } : undefined)
    .then((r) => r.data);
}

export function setup(body: SetupRequest, baseUrl?: string) {
  return http
    .post<SetupResponse>(`${API}/setup`, body, baseUrl ? { baseURL: baseUrl } : undefined)
    .then((r) => r.data);
}

export function login(body: LoginRequest, baseUrl?: string) {
  return http
    .post<LoginResponse>(`${API}/auth/login`, body, baseUrl ? { baseURL: baseUrl } : undefined)
    .then((r) => r.data);
}

export function refresh(refreshToken: string, baseUrl?: string) {
  return http
    .post<RefreshResponse>(
      `${API}/auth/refresh`,
      { refreshToken } satisfies RefreshRequest,
      baseUrl ? { baseURL: baseUrl } : undefined,
    )
    .then((r) => r.data);
}

export function logout() {
  return http.post<void>(`${API}/auth/logout`).then((r) => r.data);
}

export function getMe() {
  return http.get<UserDto>(`${API}/auth/me`).then((r) => r.data);
}

// --- Libraries ---
export function getLibraries() {
  return http.get<LibraryDto[]>(`${API}/libraries`).then((r) => r.data);
}

export function getLibrary(id: string) {
  return http.get<LibraryDto>(`${API}/libraries/${id}`).then((r) => r.data);
}

export function createLibrary(body: CreateLibraryRequest) {
  return http.post<LibraryDto>(`${API}/libraries`, body).then((r) => r.data);
}

export function deleteLibrary(id: string) {
  return http.delete<void>(`${API}/libraries/${id}`).then((r) => r.data);
}

export function scanLibrary(id: string) {
  return http.post<ScanJobAccepted>(`${API}/libraries/${id}/scan`).then((r) => r.data);
}

export function updateLibrary(id: string, body: UpdateLibraryRequest) {
  return http.patch<LibraryDto>(`${API}/libraries/${id}`, body).then((r) => r.data);
}

export function refreshLibraryMetadata(id: string, body: RefreshLibraryMetadataRequest = {}) {
  return http
    .post<LibraryMetadataRefreshAccepted>(`${API}/libraries/${id}/refresh-metadata`, body)
    .then((r) => r.data);
}

export interface LibraryItemsQuery {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: 'title' | 'year' | 'added' | 'rating' | 'runtime';
  order?: 'asc' | 'desc';
  genre?: string;
  year?: number;
  watched?: boolean;
  q?: string;
}

export function getLibraryItems(id: string, query: LibraryItemsQuery) {
  return http
    .get<PagedResult<MediaItemSummary>>(`${API}/libraries/${id}/items`, {
      params: query,
    })
    .then((r) => r.data);
}

// --- Items / details ---
export function getItem(id: string) {
  return http.get<ItemDetail>(`${API}/items/${id}`).then((r) => r.data);
}

/** Admin: delete on-disk video file(s) for a movie or episode. */
export function deleteMediaFile(id: string) {
  return http.delete<DeleteMediaFileResponse>(`${API}/items/${id}/file`).then((r) => r.data);
}

export function getSeasons(seriesId: string) {
  return http.get<PagedResult<Season>>(`${API}/series/${seriesId}/seasons`).then((r) => r.data);
}

export function getEpisodes(seasonId: string) {
  return http
    .get<PagedResult<EpisodeSummary>>(`${API}/seasons/${seasonId}/episodes`)
    .then((r) => r.data);
}

export function getEpisode(id: string) {
  return http.get<EpisodeDetail>(`${API}/episodes/${id}`).then((r) => r.data);
}

// --- Search ---
export function search(q: string, kinds?: string) {
  return http
    .get<SearchResponse>(`${API}/search`, { params: { q, kinds, limit: 20 } })
    .then((r) => r.data);
}

// --- Home / continue watching ---
export function getHome() {
  return http.get<HomeResponse>(`${API}/home`).then((r) => r.data);
}

export function getContinueWatching(limit = 20) {
  return http
    .get<PagedResult<MediaItemSummary>>(`${API}/continue-watching`, {
      params: { limit },
    })
    .then((r) => r.data);
}

// --- Playback ---
export function playbackDecision(body: PlaybackDecisionRequest) {
  return http
    .post<PlaybackDecisionResponse>(`${API}/playback/decision`, body)
    .then((r) => r.data);
}

export function setQuality(sessionId: string, body: SetQualityRequest) {
  return http
    .post<PlaybackDecisionResponse>(`${API}/playback/${sessionId}/set-quality`, body)
    .then((r) => r.data);
}

export function seekSession(sessionId: string, body: { positionMs: number }) {
  return http
    .post<PlaybackDecisionResponse>(`${API}/playback/${sessionId}/seek`, body)
    .then((r) => r.data);
}

export function pingSession(sessionId: string) {
  return http.post<import('./types').PlaybackPingResponse>(`${API}/playback/${sessionId}/ping`).then((r) => r.data);
}

export function stopSession(sessionId: string) {
  return http.post<void>(`${API}/playback/${sessionId}/stop`).then((r) => r.data);
}

// --- Progress ---
export function putProgress(itemId: string, body: ProgressRequest) {
  return http.put<ProgressResponse>(`${API}/progress/${itemId}`, body).then((r) => r.data);
}

export function getProgress(itemId: string) {
  return http.get<ProgressResponse>(`${API}/progress/${itemId}`).then((r) => r.data);
}

// --- History ---
export function getHistory(page = 1, pageSize = 50) {
  return http
    .get<PagedResult<HistoryEntry>>(`${API}/history`, { params: { page, pageSize } })
    .then((r) => r.data);
}

export function clearHistory() {
  return http.delete<ClearHistoryResponse>(`${API}/history`).then((r) => r.data);
}

export function importPlexHistory(body: ImportPlexHistoryRequest) {
  return http.post<ImportPlexHistoryResponse>(`${API}/history/import/plex`, body).then((r) => r.data);
}

// --- Admin: users ---
export function getUsers() {
  return http.get<UserDto[]>(`${API}/users`).then((r) => r.data);
}

export function createUser(body: CreateUserRequest) {
  return http.post<UserDto>(`${API}/users`, body).then((r) => r.data);
}

export function updateUser(id: string, body: UpdateUserRequest) {
  return http.patch<UserDto>(`${API}/users/${id}`, body).then((r) => r.data);
}

export function deleteUser(id: string) {
  return http.delete<void>(`${API}/users/${id}`).then((r) => r.data);
}

// --- Admin: settings / jobs / imports / metadata ---
export function getServerSettings() {
  return http.get<ServerSettingsDto>(`${API}/settings`).then((r) => r.data);
}

export function putServerSettings(body: ServerSettingsDto) {
  return http.put<ServerSettingsDto>(`${API}/settings`, body).then((r) => r.data);
}

export function getJobs(page = 1, pageSize = 50) {
  return http
    .get<PagedResult<JobDto>>(`${API}/jobs`, { params: { page, pageSize } })
    .then((r) => r.data);
}

export function getJob(id: string) {
  return http.get<JobDto>(`${API}/jobs/${id}`).then((r) => r.data);
}

export function cancelJob(id: string) {
  return http.post<void>(`${API}/jobs/${id}/cancel`).then((r) => r.data);
}

export function getImports(page = 1, pageSize = 50) {
  return http
    .get<PagedResult<ImportJobDto>>(`${API}/imports`, { params: { page, pageSize } })
    .then((r) => r.data);
}

export function refreshMetadata(itemId: string) {
  return http.post<JobDto>(`${API}/items/${itemId}/refresh-metadata`).then((r) => r.data);
}

export function matchItem(itemId: string, body: { provider: string; providerId: string }) {
  return http.post<JobDto>(`${API}/items/${itemId}/match`, body).then((r) => r.data);
}

export function getMatchCandidates(itemId: string, q?: string, year?: number) {
  return http
    .get<MetadataMatchCandidateDto[]>(`${API}/items/${itemId}/match-candidates`, {
      params: { q: q || undefined, year: year || undefined },
    })
    .then((r) => r.data);
}

export function updateItemMetadata(itemId: string, body: UpdateItemMetadataRequest) {
  return http.patch<void>(`${API}/items/${itemId}/metadata`, body).then((r) => r.data);
}

export function getArtworkCandidates(itemId: string, kind: ArtworkKindParam = 'Poster') {
  return http
    .get<ArtworkCandidateDto[]>(`${API}/items/${itemId}/artwork-candidates`, {
      params: { kind },
    })
    .then((r) => r.data);
}

export function setItemArtwork(itemId: string, kind: ArtworkKindParam, body: SetItemArtworkRequest) {
  return http.put<void>(`${API}/items/${itemId}/artwork/${kind}`, body).then((r) => r.data);
}
