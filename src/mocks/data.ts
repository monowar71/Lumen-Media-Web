import type {
  EpisodeDetail,
  EpisodeSummary,
  HistoryEntry,
  HomeResponse,
  LibraryDto,
  MediaItemSummary,
  MovieDetail,
  PlaybackDecisionResponse,
  Season,
  SeriesDetail,
  UserDto,
} from '@/api/types';

export const mockUser: UserDto = {
  id: 'user-1',
  username: 'alex',
  role: 'Admin',
  libraryAccess: '*',
  allowTranscoding: true,
  maxBitrateKbpsRemote: 8000,
  createdAt: '2026-06-01T00:00:00Z',
};

export const mockLibraries: LibraryDto[] = [
  { id: 'lib-movies', name: 'Movies', type: 'Movies', itemCount: 3, paths: ['/media/movies'] },
  { id: 'lib-series', name: 'TV Shows', type: 'Series', itemCount: 1, paths: ['/media/tv'] },
];

function poster(id: string) {
  return `/api/v1/items/${id}/artwork/Poster`;
}
function backdrop(id: string) {
  return `/api/v1/items/${id}/artwork/Backdrop`;
}

export const mockMovies: MediaItemSummary[] = [
  {
    id: 'movie-matrix',
    kind: 'Movie',
    title: 'The Matrix',
    year: 1999,
    runtimeMs: 8160000,
    communityRating: 8.7,
    officialRating: 'R',
    genres: ['Action', 'Sci-Fi'],
    artwork: { poster: poster('movie-matrix'), backdrop: backdrop('movie-matrix') },
    userData: { watched: false, playbackPositionMs: 2400000, isFavorite: true },
    addedAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'movie-inception',
    kind: 'Movie',
    title: 'Inception',
    year: 2010,
    runtimeMs: 8880000,
    communityRating: 8.8,
    officialRating: 'PG-13',
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    artwork: { poster: poster('movie-inception'), backdrop: backdrop('movie-inception') },
    userData: { watched: true, playbackPositionMs: 0 },
    addedAt: '2026-07-05T10:00:00Z',
  },
  {
    id: 'movie-dune',
    kind: 'Movie',
    title: 'Dune',
    year: 2021,
    runtimeMs: 9300000,
    communityRating: 8.0,
    officialRating: 'PG-13',
    genres: ['Adventure', 'Sci-Fi'],
    artwork: { poster: poster('movie-dune'), backdrop: backdrop('movie-dune') },
    userData: { watched: false, playbackPositionMs: 0 },
    addedAt: '2026-07-10T10:00:00Z',
  },
];

export const mockSeriesSummary: MediaItemSummary = {
  id: 'series-bb',
  kind: 'Series',
  title: 'Breaking Bad',
  year: 2008,
  runtimeMs: null,
  communityRating: 9.5,
  officialRating: 'TV-MA',
  genres: ['Crime', 'Drama'],
  artwork: { poster: poster('series-bb'), backdrop: backdrop('series-bb') },
  userData: { watched: false, playbackPositionMs: 0 },
  addedAt: '2026-06-20T09:00:00Z',
};

export const mockMovieDetail: Record<string, MovieDetail> = {
  'movie-matrix': {
    id: 'movie-matrix',
    kind: 'Movie',
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    year: 1999,
    releaseDate: '1999-03-31',
    overview:
      'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    tagline: 'Welcome to the Real World',
    runtimeMs: 8160000,
    communityRating: 8.7,
    officialRating: 'R',
    genres: ['Action', 'Sci-Fi'],
    studios: ['Warner Bros.'],
    people: [
      { name: 'Keanu Reeves', role: 'Neo', type: 'Actor', order: 0 },
      { name: 'Laurence Fishburne', role: 'Morpheus', type: 'Actor', order: 1 },
      { name: 'Carrie-Anne Moss', role: 'Trinity', type: 'Actor', order: 2 },
    ],
    externalIds: { tmdb: '603', imdb: 'tt0133093', tvdb: null },
    artwork: {
      poster: poster('movie-matrix'),
      backdrop: backdrop('movie-matrix'),
      logo: `/api/v1/items/movie-matrix/artwork/Logo`,
    },
    mediaSources: [
      {
        id: 'src-matrix-01',
        container: 'mkv',
        sizeBytes: 34359738368,
        durationMs: 8160000,
        overallBitrateKbps: 84000,
        streams: [
          {
            id: 'strm-v1',
            kind: 'Video',
            index: 0,
            codec: 'hevc',
            profile: 'Main 10',
            width: 3840,
            height: 2160,
            frameRate: 23.976,
            bitrateKbps: 78000,
            hdr: 'HDR10',
            isDefault: true,
          },
          {
            id: 'strm-a1',
            kind: 'Audio',
            index: 1,
            codec: 'eac3',
            language: 'eng',
            channels: 6,
            sampleRate: 48000,
            isDefault: true,
          },
          {
            id: 'strm-s1',
            kind: 'Subtitle',
            index: 2,
            codec: 'subrip',
            language: 'eng',
            format: 'srt',
            isExternal: false,
          },
        ],
      },
    ],
    userData: { watched: false, playbackPositionMs: 2400000, isFavorite: true },
    libraryId: 'lib-movies',
    addedAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-10T12:00:00Z',
  },
  'movie-inception': {
    id: 'movie-inception',
    kind: 'Movie',
    title: 'Inception',
    year: 2010,
    releaseDate: '2010-07-16',
    overview:
      'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    runtimeMs: 8880000,
    communityRating: 8.8,
    officialRating: 'PG-13',
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    studios: ['Legendary Pictures'],
    people: [{ name: 'Leonardo DiCaprio', role: 'Cobb', type: 'Actor', order: 0 }],
    externalIds: { tmdb: '27205', imdb: 'tt1375666' },
    artwork: { poster: poster('movie-inception'), backdrop: backdrop('movie-inception') },
    mediaSources: [
      {
        id: 'src-inception-01',
        container: 'mp4',
        sizeBytes: 8589934592,
        durationMs: 8880000,
        overallBitrateKbps: 8000,
        streams: [
          {
            id: 'strm-iv1',
            kind: 'Video',
            index: 0,
            codec: 'h264',
            width: 1920,
            height: 1080,
            frameRate: 23.976,
            bitrateKbps: 7500,
            isDefault: true,
          },
          {
            id: 'strm-ia1',
            kind: 'Audio',
            index: 1,
            codec: 'aac',
            language: 'eng',
            channels: 2,
            isDefault: true,
          },
        ],
      },
    ],
    userData: { watched: true, playbackPositionMs: 0 },
    libraryId: 'lib-movies',
    addedAt: '2026-07-05T10:00:00Z',
  },
  /** Disposable mock used only in UI/API tests — never a real NAS file. */
  'movie-mock-delete': {
    id: 'movie-mock-delete',
    kind: 'Movie',
    title: 'Mock Delete Me',
    year: 2026,
    overview: 'Synthetic fixture for download/delete tests. Safe to remove.',
    runtimeMs: 60000,
    communityRating: 1,
    genres: ['Test'],
    artwork: { poster: poster('movie-mock-delete') },
    mediaSources: [
      {
        id: 'src-mock-delete-01',
        path: '/media/mock/delete-me.mkv',
        container: 'mkv',
        sizeBytes: 1024,
        durationMs: 60000,
        overallBitrateKbps: 100,
        streams: [
          {
            id: 'strm-mock-v1',
            kind: 'Video',
            index: 0,
            codec: 'h264',
            width: 640,
            height: 360,
            isDefault: true,
          },
        ],
      },
    ],
    userData: { watched: false, playbackPositionMs: 0 },
    libraryId: 'lib-movies',
    addedAt: '2026-07-19T00:00:00Z',
  },
  'movie-dune': {
    id: 'movie-dune',
    kind: 'Movie',
    title: 'Dune',
    year: 2021,
    overview: 'A noble family becomes embroiled in a war for control over the galaxy.',
    runtimeMs: 9300000,
    communityRating: 8.0,
    officialRating: 'PG-13',
    genres: ['Adventure', 'Sci-Fi'],
    externalIds: { tmdb: '438631' },
    artwork: { poster: poster('movie-dune'), backdrop: backdrop('movie-dune') },
    mediaSources: [
      {
        id: 'src-dune-01',
        container: 'mkv',
        sizeBytes: 21474836480,
        durationMs: 9300000,
        overallBitrateKbps: 18000,
        streams: [
          {
            id: 'strm-dv1',
            kind: 'Video',
            index: 0,
            codec: 'h264',
            width: 1920,
            height: 1080,
            bitrateKbps: 17000,
            isDefault: true,
          },
          { id: 'strm-da1', kind: 'Audio', index: 1, codec: 'ac3', language: 'eng', channels: 6 },
        ],
      },
    ],
    userData: { watched: false, playbackPositionMs: 0 },
    libraryId: 'lib-movies',
    addedAt: '2026-07-10T10:00:00Z',
  },
};

export const mockSeriesDetail: SeriesDetail = {
  id: 'series-bb',
  kind: 'Series',
  title: 'Breaking Bad',
  year: 2008,
  endYear: 2013,
  status: 'Ended',
  overview:
    'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine to secure his family\u2019s future.',
  communityRating: 9.5,
  officialRating: 'TV-MA',
  genres: ['Crime', 'Drama'],
  externalIds: { tmdb: '1396', tvdb: '81189', imdb: 'tt0903747' },
  seasonCount: 1,
  episodeCount: 2,
  artwork: { poster: poster('series-bb'), backdrop: backdrop('series-bb') },
  userData: { unwatchedEpisodeCount: 1 },
  libraryId: 'lib-series',
  addedAt: '2026-06-20T09:00:00Z',
};

export const mockSeasons: Season[] = [
  {
    id: 'season-bb-1',
    seriesId: 'series-bb',
    seasonNumber: 1,
    name: 'Season 1',
    episodeCount: 2,
    artwork: { poster: poster('series-bb') },
  },
];

export const mockEpisodes: Record<string, EpisodeSummary[]> = {
  'season-bb-1': [
    {
      id: 'ep-bb-101',
      kind: 'Episode',
      seriesId: 'series-bb',
      seasonId: 'season-bb-1',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pilot',
      overview: 'Walter White, a struggling chemistry teacher, is diagnosed with lung cancer.',
      airDate: '2008-01-20',
      runtimeMs: 3480000,
      artwork: { thumb: `/api/v1/items/ep-bb-101/artwork/Thumb` },
      userData: { watched: true, playbackPositionMs: 3480000 },
    },
    {
      id: 'ep-bb-102',
      kind: 'Episode',
      seriesId: 'series-bb',
      seasonId: 'season-bb-1',
      seasonNumber: 1,
      episodeNumber: 2,
      title: "Cat's in the Bag...",
      overview: 'Walt and Jesse attempt to tie up loose ends.',
      airDate: '2008-01-27',
      runtimeMs: 2880000,
      artwork: { thumb: `/api/v1/items/ep-bb-102/artwork/Thumb` },
      userData: { watched: false, playbackPositionMs: 600000 },
    },
  ],
};

export const mockEpisodeDetail: Record<string, EpisodeDetail> = {
  'ep-bb-101': {
    ...mockEpisodes['season-bb-1'][0],
    mediaSources: [
      {
        id: 'src-ep101',
        container: 'mkv',
        sizeBytes: 2147483648,
        durationMs: 3480000,
        overallBitrateKbps: 5000,
        streams: [
          { id: 'strm-ev1', kind: 'Video', index: 0, codec: 'h264', width: 1280, height: 720 },
          { id: 'strm-ea1', kind: 'Audio', index: 1, codec: 'aac', language: 'eng', channels: 2 },
        ],
      },
    ],
  },
  'ep-bb-102': {
    ...mockEpisodes['season-bb-1'][1],
    mediaSources: [
      {
        id: 'src-ep102',
        container: 'mkv',
        sizeBytes: 2147483648,
        durationMs: 2880000,
        overallBitrateKbps: 5000,
        streams: [
          { id: 'strm-ev2', kind: 'Video', index: 0, codec: 'h264', width: 1280, height: 720 },
          { id: 'strm-ea2', kind: 'Audio', index: 1, codec: 'aac', language: 'eng', channels: 2 },
        ],
      },
    ],
  },
};

export function itemsForLibrary(libraryId: string): MediaItemSummary[] {
  if (libraryId === 'lib-series') return [mockSeriesSummary];
  return mockMovies;
}

export const mockHome: HomeResponse = {
  sections: [
    { id: 'continue', title: 'Continue Watching', items: [mockMovies[0]] },
    { id: 'recentlyAdded', title: 'Recently Added', items: [...mockMovies].reverse() },
    { id: 'recommended', title: 'Recommended', items: [mockMovies[2], mockSeriesSummary] },
  ],
};

/**
 * Deterministic playback decision used by mocks and tests. A high-bitrate HEVC
 * source (Matrix) yields Transcode; an h264/mp4 source yields DirectPlay. This
 * exercises both branches of the player's source-selection logic.
 */
export function decideForMedia(
  mediaId: string,
  mode: 'auto' | 'manual',
  qualityId: string | null | undefined,
  resumePositionMs: number,
): PlaybackDecisionResponse {
  const directPlayIds = new Set(['movie-inception']);
  const isDirect = directPlayIds.has(mediaId);
  const sessionId = `sess-${mediaId}`;

  const availableQualities = [
    { id: 'auto', label: 'Auto', adaptive: true },
    {
      id: 'original',
      label: 'Original (4K, ~80 Mbps)',
      width: 3840,
      height: 2160,
      bitrateKbps: 80000,
    },
    { id: '1440p', label: '1440p (~16 Mbps)', width: 2560, height: 1440, bitrateKbps: 16000 },
    { id: '1080p-high', label: '1080p High (~20 Mbps)', width: 1920, height: 1080, bitrateKbps: 20000 },
    { id: '1080p', label: '1080p (~10 Mbps)', width: 1920, height: 1080, bitrateKbps: 10000 },
    { id: '720p', label: '720p (~4 Mbps)', width: 1280, height: 720, bitrateKbps: 4000 },
    { id: '480p', label: '480p (~1.5 Mbps)', width: 854, height: 480, bitrateKbps: 1500 },
    { id: '360p', label: '360p (~0.7 Mbps)', width: 640, height: 360, bitrateKbps: 700 },
  ];

  const selectedQualityId = mode === 'manual' && qualityId ? qualityId : 'auto';

  if (isDirect && selectedQualityId === 'auto') {
    return {
      sessionId,
      method: 'DirectPlay',
      mode,
      streamUrl: `/api/v1/items/${mediaId}/download`,
      container: 'mp4',
      startPositionMs: resumePositionMs,
      durationMs: 8880000,
      selectedQualityId: 'original',
      availableQualities,
      audioStreams: [
        {
          id: 'strm-ia1',
          language: 'eng',
          title: 'English',
          codec: 'aac',
          channels: 2,
          isDefault: true,
        },
      ],
      subtitleStreams: [],
      expiresAt: '2099-01-01T00:00:00Z',
    };
  }

  const streamUrl =
    selectedQualityId === 'auto'
      ? `/api/v1/stream/${sessionId}/master.m3u8`
      : `/api/v1/stream/${sessionId}/index.m3u8`;

  return {
    sessionId,
    method: 'Transcode',
    mode,
    streamUrl,
    container: 'hls',
    startPositionMs: resumePositionMs,
    durationMs: 8160000,
    selectedQualityId,
    availableQualities,
    audioStreams: [
      {
        id: 'strm-a1',
        language: 'eng',
        title: 'English',
        codec: 'eac3',
        channels: 6,
        isDefault: true,
      },
      {
        id: 'strm-a2',
        language: 'rus',
        title: 'LostFilm',
        codec: 'aac',
        channels: 2,
      },
    ],
    subtitleStreams: [
      {
        id: 'strm-s1',
        language: 'eng',
        title: 'English (SDH)',
        format: 'srt',
        deliveryUrl: `/api/v1/items/${mediaId}/subtitles/strm-s1.vtt`,
      },
    ],
    expiresAt: '2099-01-01T00:00:00Z',
  };
}

/** Mutable watch-history store for MSW (cleared/imported in tests). */
export let mockHistory: HistoryEntry[] = [
  {
    itemId: 'movie-inception',
    kind: 'Movie',
    title: 'Inception',
    year: 2010,
    artwork: { poster: poster('movie-inception') },
    watched: true,
    positionMs: 0,
    durationMs: 8880000,
    updatedAt: '2026-07-15T18:00:00Z',
  },
  {
    itemId: null,
    kind: 'Movie',
    title: 'Lost Plex Movie',
    artwork: {},
    watched: true,
    positionMs: 0,
    durationMs: null,
    updatedAt: '2026-07-14T20:00:00Z',
    isExternal: true,
    externalKey: 'm:tmdb:999001',
  },
  {
    itemId: 'movie-matrix',
    kind: 'Movie',
    title: 'The Matrix',
    year: 1999,
    artwork: { poster: poster('movie-matrix') },
    watched: false,
    positionMs: 2400000,
    durationMs: 8160000,
    updatedAt: '2026-07-14T12:00:00Z',
  },
  {
    itemId: 'ep-bb-s1e1',
    kind: 'Episode',
    title: 'Pilot',
    seriesTitle: 'Breaking Bad',
    seriesId: 'series-bb',
    seasonNumber: 1,
    episodeNumber: 1,
    year: 2008,
    artwork: { poster: poster('series-bb') },
    watched: true,
    positionMs: 0,
    durationMs: 3480000,
    updatedAt: '2026-07-13T21:00:00Z',
  },
];

export function resetMockHistory() {
  mockHistory = [
    {
      itemId: 'movie-inception',
      kind: 'Movie',
      title: 'Inception',
      year: 2010,
      artwork: { poster: poster('movie-inception') },
      watched: true,
      positionMs: 0,
      durationMs: 8880000,
      updatedAt: '2026-07-15T18:00:00Z',
    },
    {
      itemId: null,
      kind: 'Movie',
      title: 'Lost Plex Movie',
      artwork: {},
      watched: true,
      positionMs: 0,
      durationMs: null,
      updatedAt: '2026-07-14T20:00:00Z',
      isExternal: true,
      externalKey: 'm:tmdb:999001',
    },
    {
      itemId: 'movie-matrix',
      kind: 'Movie',
      title: 'The Matrix',
      year: 1999,
      artwork: { poster: poster('movie-matrix') },
      watched: false,
      positionMs: 2400000,
      durationMs: 8160000,
      updatedAt: '2026-07-14T12:00:00Z',
    },
    {
      itemId: 'ep-bb-s1e1',
      kind: 'Episode',
      title: 'Pilot',
      seriesTitle: 'Breaking Bad',
      seriesId: 'series-bb',
      seasonNumber: 1,
      episodeNumber: 1,
      year: 2008,
      artwork: { poster: poster('series-bb') },
      watched: true,
      positionMs: 0,
      durationMs: 3480000,
      updatedAt: '2026-07-13T21:00:00Z',
    },
  ];
}
