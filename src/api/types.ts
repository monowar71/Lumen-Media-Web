/**
 * App-facing DTOs. Schema source of truth: ../server/openapi.json
 * Regenerated via `npm run generate:api` → ./generated/schema.d.ts
 *
 * Enums and most request/response shapes are re-exported from the generated
 * OpenAPI types. A few UI-facing details keep slightly stricter shapes where
 * ASP.NET OpenAPI still emits optional/`number|string` quirks for int64.
 */
import type { components } from './generated/schema';

type S = components['schemas'];

export type MediaKind = S['MediaKind'];
export type LibraryType = S['LibraryType'];
export type StreamKind = S['StreamKind'];
export type PlaybackMethod = S['PlaybackMethod'];
export type PlaybackMode = S['PlaybackMode'];
export type ArtworkKind = S['ArtworkKind'];
export type UserRole = S['UserRole'];
export type JobState = S['JobState'];
export type JobType = S['JobType'];
export type ProgressState = 'playing' | 'paused' | 'stopped';

export type LibraryAccess = '*' | string[];

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  nextCursor: string | null;
}

export type ProblemDetails = S['ProblemDetails'] & {
  errors?: Record<string, string[]>;
};

export type UserDto = Omit<S['UserDto'], 'libraryAccess' | 'maxBitrateKbpsRemote' | 'createdAt'> & {
  libraryAccess: LibraryAccess;
  allowTranscoding: boolean;
  maxBitrateKbpsRemote?: number;
  createdAt: string;
};

export type LoginRequest = S['LoginRequest'];
export type LoginResponse = S['TokenResponse'] & { user: UserDto; expiresInSec: number; tokenType: string };
export type RefreshRequest = S['RefreshRequest'];
export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
};

export type SetupRequest = S['SetupRequest'];
export type SetupResponse = S['SetupResponse'];
export type ServerInfo = S['ServerInfoResponse'];
export type CreateUserRequest = S['CreateUserRequest'];
export type UpdateUserRequest = S['UpdateUserRequest'];

export type ArtworkSet = {
  poster?: string;
  backdrop?: string;
  logo?: string;
  thumb?: string;
  banner?: string;
};

export type UserData = {
  watched?: boolean;
  playbackPositionMs?: number;
  isFavorite?: boolean;
  unwatchedEpisodeCount?: number;
  nextUp?: EpisodeSummary;
};

export type MediaItemSummary = {
  id: string;
  kind: Exclude<MediaKind, 'Episode'>;
  title: string;
  originalTitle?: string;
  year?: number;
  runtimeMs?: number | null;
  communityRating?: number;
  officialRating?: string;
  genres?: string[];
  artwork: ArtworkSet;
  userData: UserData;
  addedAt: string;
};

export type Person = {
  name: string;
  role?: string;
  type?: string;
  order?: number;
  thumb?: string;
};

export type MediaStream = {
  id: string;
  kind: StreamKind;
  index: number;
  codec: string;
  profile?: string;
  language?: string;
  title?: string;
  isDefault?: boolean;
  isForced?: boolean;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrateKbps?: number;
  hdr?: string | null;
  channels?: number;
  sampleRate?: number;
  isExternal?: boolean;
  format?: string;
};

export type MediaSource = {
  id: string;
  path?: string;
  container: string;
  sizeBytes: number;
  durationMs: number;
  overallBitrateKbps: number;
  streams: MediaStream[];
};

export type MovieDetail = {
  id: string;
  kind: 'Movie';
  title: string;
  originalTitle?: string;
  sortTitle?: string;
  year?: number;
  releaseDate?: string;
  overview?: string;
  tagline?: string;
  runtimeMs?: number;
  communityRating?: number;
  officialRating?: string;
  genres?: string[];
  studios?: string[];
  people?: Person[];
  externalIds?: { tmdb?: string | null; tvdb?: string | null; imdb?: string | null };
  metadataLocked?: boolean;
  trailers?: { site: string; key: string }[];
  artwork: ArtworkSet;
  mediaSources: MediaSource[];
  userData: UserData;
  libraryId: string;
  addedAt: string;
  updatedAt?: string;
};

export type SeriesDetail = {
  id: string;
  kind: 'Series';
  title: string;
  originalTitle?: string;
  year?: number;
  endYear?: number;
  status?: string;
  overview?: string;
  communityRating?: number;
  officialRating?: string;
  genres?: string[];
  people?: Person[];
  externalIds?: { tmdb?: string | null; tvdb?: string | null; imdb?: string | null };
  metadataLocked?: boolean;
  seasonCount: number;
  episodeCount: number;
  artwork: ArtworkSet;
  userData: UserData;
  libraryId: string;
  addedAt: string;
};

export type UpdateItemMetadataRequest = {
  title?: string | null;
  originalTitle?: string | null;
  year?: number | null;
  overview?: string | null;
  tagline?: string | null;
  communityRating?: number | null;
  officialRating?: string | null;
  metadataLocked?: boolean | null;
};

export type MetadataMatchCandidateDto = {
  provider: string;
  providerId: string;
  title: string;
  year?: number | null;
  score: number;
};

export type ItemDetail = MovieDetail | SeriesDetail;

export type Season = {
  id: string;
  seriesId: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  artwork: ArtworkSet;
};

export type EpisodeSummary = {
  id: string;
  kind: 'Episode';
  seriesId: string;
  seasonId: string;
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  overview?: string;
  airDate?: string;
  runtimeMs?: number;
  artwork: ArtworkSet;
  userData: UserData;
};

export type EpisodeDetail = EpisodeSummary & {
  mediaSources: MediaSource[];
};

export type LibraryDto = {
  id: string;
  name: string;
  type: LibraryType;
  paths?: string[];
  itemCount: number;
  settings?: Record<string, unknown>;
  lastScanAt?: string;
};

export type CreateLibraryRequest = {
  name: string;
  type: LibraryType;
  paths: string[];
};

export type JobDto = {
  id: string;
  type: JobType;
  state: JobState;
  progress: number;
  message?: string | null;
  libraryId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
};

/** @deprecated Prefer JobDto — scan returns the full job DTO. */
export type ScanJobAccepted = JobDto;

export type HomeSection = {
  id: string;
  title: string;
  items: MediaItemSummary[];
};

export type HomeResponse = {
  sections: HomeSection[];
};

export type SearchResponse = {
  movies: MediaItemSummary[];
  series: MediaItemSummary[];
  episodes: EpisodeSummary[];
};

export type DeviceProfile = {
  maxResolution: string;
  maxBitrateKbps: number;
  videoCodecs: string[];
  audioCodecs: string[];
  containers: string[];
  subtitleFormats: string[];
  supportsHevc: boolean;
  supportsHdr: boolean;
};

export type PlaybackDecisionRequest = {
  mediaId: string;
  mediaSourceId?: string;
  mode: PlaybackMode;
  qualityId?: string | null;
  audioStreamId?: string | null;
  subtitleStreamId?: string | null;
  resumePositionMs: number;
  profile: DeviceProfile;
};

export type QualityOption = {
  id: string;
  label: string;
  adaptive?: boolean;
  width?: number;
  height?: number;
  bitrateKbps?: number;
};

export type AudioStreamOption = {
  id: string;
  language?: string;
  codec?: string;
  channels?: number;
  isDefault?: boolean;
};

export type SubtitleStreamOption = {
  id: string;
  language?: string;
  format?: string;
  deliveryUrl: string;
};

export type PlaybackDecisionResponse = {
  sessionId: string;
  method: PlaybackMethod;
  mode: PlaybackMode;
  streamUrl: string;
  container: string;
  startPositionMs?: number;
  /** Probed full duration; prefer over HLS video.duration while playlist grows. */
  durationMs?: number | null;
  selectedQualityId: string;
  availableQualities: QualityOption[];
  audioStreams: AudioStreamOption[];
  subtitleStreams: SubtitleStreamOption[];
  expiresAt?: string;
  reason?: string;
};

export type SetQualityRequest = {
  qualityId: string;
  mode: PlaybackMode;
  resumePositionMs: number;
};

export type ProgressRequest = {
  positionMs: number;
  durationMs: number;
  sessionId?: string;
  state: ProgressState;
};

export type ProgressResponse = {
  itemId: string;
  positionMs: number;
  watched: boolean;
  updatedAt: string;
};

export type ServerSettingsDto = S['ServerSettingsDto'];
export type TranscodingSettingsDto = S['TranscodingSettingsDto'];
export type MetadataSettingsDto = S['MetadataSettingsDto'];
export type ImportSettingsDto = S['ImportSettingsDto'];
export type ImportJobDto = S['ImportJobDto'];
export type LadderRungDto = S['LadderRungDto'];

export type LibraryUpdatedEvent = {
  event: 'LibraryUpdated';
  libraryId: string;
  added: number;
  updated: number;
  removed: number;
};

export type JobProgressEvent = {
  event: 'JobProgress';
  job: JobDto;
};

export type PlaybackSyncEvent = {
  event: 'PlaybackSync';
  itemId: string;
  positionMs: number;
  state: ProgressState;
  originDeviceId?: string | null;
};

export type NowPlayingEvent = {
  event: 'NowPlaying';
  userId: string;
  itemId: string;
  method: PlaybackMethod;
  sessionId: string;
};
