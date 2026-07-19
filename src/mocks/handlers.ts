import { http, HttpResponse } from 'msw';
import type {
  LoginResponse,
  PagedResult,
  PlaybackDecisionRequest,
  ProgressRequest,
  ProgressResponse,
  RefreshResponse,
  SetQualityRequest,
} from '@/api/types';
import {
  decideForMedia,
  itemsForLibrary,
  mockEpisodeDetail,
  mockEpisodes,
  mockHistory,
  mockHome,
  mockLibraries,
  mockMovieDetail,
  mockSeasons,
  mockSeriesDetail,
  mockUser,
  resetMockHistory,
} from './data';

// Match regardless of the configured base URL / host.
const base = '*/api/v1';

function paged<T>(items: T[], page: number, pageSize: number): PagedResult<T> {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return {
    items: slice,
    page,
    pageSize,
    total: items.length,
    totalPages,
    nextCursor: page < totalPages ? `cursor-${page + 1}` : null,
  };
}

const ACCESS_TOKEN = 'mock-access-token';
const REFRESH_TOKEN = 'mock-refresh-token';

const artworkSvg = (label: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
     <rect width="100%" height="100%" fill="#1e212b"/>
     <text x="50%" y="50%" fill="#9aa3b2" font-family="sans-serif" font-size="28"
       text-anchor="middle" dominant-baseline="middle">${label}</text>
   </svg>`;

export const handlers = [
  http.get('*/api/v1/server/info', () =>
    HttpResponse.json({
      name: 'LumenMedia (mock)',
      version: '0.1.0',
      setupCompleted: true,
      features: { abr: true },
    }),
  ),

  http.post(`${base}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { title: 'Invalid credentials', status: 401, detail: 'Missing credentials' },
        { status: 401 },
      );
    }
    const res: LoginResponse = {
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      tokenType: 'Bearer',
      expiresInSec: 900,
      user: mockUser,
    };
    return HttpResponse.json(res);
  }),

  http.post(`${base}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken || body.refreshToken.startsWith('bad')) {
      return HttpResponse.json(
        { title: 'Unauthorized', status: 401, detail: 'Invalid refresh token' },
        { status: 401 },
      );
    }
    const res: RefreshResponse = {
      accessToken: `${ACCESS_TOKEN}-2`,
      refreshToken: `${REFRESH_TOKEN}-2`,
      expiresInSec: 900,
    };
    return HttpResponse.json(res);
  }),

  http.post(`${base}/setup`, () =>
    HttpResponse.json({ userId: 'user-1', role: 'Admin' }, { status: 201 }),
  ),

  http.post(`${base}/items/:id/refresh-metadata`, () =>
    HttpResponse.json({
      id: 'job-1',
      type: 'FetchMetadata',
      state: 'Queued',
      progress: 0,
    }),
  ),

  http.post(`${base}/libraries/:id/refresh-metadata`, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      mode?: string;
      preferredLanguage?: string;
    };
    return HttpResponse.json(
      {
        libraryId: params.id,
        mode: body.mode ?? 'Missing',
        enqueuedCount: 3,
        preferredLanguage: body.preferredLanguage ?? 'ru-RU',
      },
      { status: 202 },
    );
  }),

  http.get(`${base}/users`, () => HttpResponse.json([mockUser])),
  http.get(`${base}/settings`, () =>
    HttpResponse.json({
      transcoding: { hardwareAccel: 'auto', maxConcurrentSessions: 3, abrEnabled: true },
      metadata: { providers: [], language: 'ru-RU', fallbackLanguage: 'en-US' },
      import: { watch: true, minFileSizeMb: 50, strategy: 'Hardlink' },
    }),
  ),
  http.get(`${base}/jobs`, () =>
    HttpResponse.json({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0, nextCursor: null }),
  ),
  http.get(`${base}/imports`, () =>
    HttpResponse.json({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0, nextCursor: null }),
  ),

  http.post(`${base}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/auth/me`, () => HttpResponse.json(mockUser)),

  http.get(`${base}/libraries`, () => HttpResponse.json(mockLibraries)),
  http.get(`${base}/libraries/:id`, ({ params }) => {
    const lib = mockLibraries.find((l) => l.id === params.id);
    return lib ? HttpResponse.json(lib) : new HttpResponse(null, { status: 404 });
  }),

  http.get(`${base}/libraries/:id/items`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '40');
    const q = url.searchParams.get('q')?.toLowerCase();
    let items = itemsForLibrary(String(params.id));
    if (q) items = items.filter((i) => i.title.toLowerCase().includes(q));
    return HttpResponse.json(paged(items, page, pageSize));
  }),

  http.get(`${base}/items/:id`, ({ params }) => {
    const id = String(params.id);
    if (id === mockSeriesDetail.id) return HttpResponse.json(mockSeriesDetail);
    const movie = mockMovieDetail[id];
    return movie ? HttpResponse.json(movie) : new HttpResponse(null, { status: 404 });
  }),

  http.get(`${base}/series/:id/seasons`, () =>
    HttpResponse.json(paged(mockSeasons, 1, 50)),
  ),
  http.get(`${base}/seasons/:id/episodes`, ({ params }) =>
    HttpResponse.json(paged(mockEpisodes[String(params.id)] ?? [], 1, 50)),
  ),
  http.get(`${base}/episodes/:id`, ({ params }) => {
    const ep = mockEpisodeDetail[String(params.id)];
    return ep ? HttpResponse.json(ep) : new HttpResponse(null, { status: 404 });
  }),

  http.get(`${base}/home`, () => HttpResponse.json(mockHome)),
  http.get(`${base}/continue-watching`, () =>
    HttpResponse.json(paged(mockHome.sections[0].items, 1, 20)),
  ),

  http.get(`${base}/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const movies = itemsForLibrary('lib-movies').filter((m) => m.title.toLowerCase().includes(q));
    const series = [mockSeriesDetail].filter((s) => s.title.toLowerCase().includes(q));
    return HttpResponse.json({
      movies,
      series: series.map((s) => ({
        id: s.id,
        kind: 'Series' as const,
        title: s.title,
        year: s.year,
        artwork: s.artwork,
        userData: s.userData,
        addedAt: s.addedAt,
      })),
      episodes: [],
    });
  }),

  http.post(`${base}/playback/decision`, async ({ request }) => {
    const body = (await request.json()) as PlaybackDecisionRequest;
    return HttpResponse.json(
      decideForMedia(body.mediaId, body.mode, body.qualityId, body.resumePositionMs),
      { status: 201 },
    );
  }),

  http.post(`${base}/playback/:sessionId/set-quality`, async ({ params, request }) => {
    const body = (await request.json()) as SetQualityRequest;
    const mediaId = String(params.sessionId).replace(/^sess-/, '');
    return HttpResponse.json(
      decideForMedia(mediaId, body.mode, body.qualityId, body.resumePositionMs),
    );
  }),

  http.post(`${base}/playback/:sessionId/ping`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${base}/playback/:sessionId/stop`, () => new HttpResponse(null, { status: 204 })),

  http.put(`${base}/progress/:itemId`, async ({ params, request }) => {
    const body = (await request.json()) as ProgressRequest;
    const watchedExplicit = typeof body.watched === 'boolean' ? body.watched : undefined;
    const watched =
      watchedExplicit ??
      (body.state === 'stopped' &&
        (body.durationMs ?? 0) > 0 &&
        (body.positionMs ?? 0) / (body.durationMs ?? 1) >= 0.9);
    const res: ProgressResponse = {
      itemId: String(params.itemId),
      positionMs: watched ? 0 : (body.positionMs ?? 0),
      watched,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(res);
  }),
  http.get(`${base}/progress/:itemId`, ({ params }) =>
    HttpResponse.json({
      itemId: String(params.itemId),
      positionMs: 0,
      watched: false,
      updatedAt: new Date().toISOString(),
    } satisfies ProgressResponse),
  ),

  http.get(`${base}/history`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
    return HttpResponse.json(paged(mockHistory, page, pageSize));
  }),

  http.delete(`${base}/history`, () => {
    const clearedCount = mockHistory.length;
    mockHistory.length = 0;
    return HttpResponse.json({ clearedCount });
  }),

  http.post(`${base}/history/import/plex`, async ({ request }) => {
    const body = (await request.json()) as { baseUrl?: string; token?: string };
    if (!body.baseUrl || !body.token) {
      return HttpResponse.json(
        { title: 'Validation failed', status: 400, detail: 'baseUrl and token required' },
        { status: 400 },
      );
    }
    resetMockHistory();
    return HttpResponse.json({
      scanned: 10,
      matched: 3,
      imported: 3,
      skippedNewer: 0,
      unmatched: 7,
    });
  }),

  // Artwork placeholder so the browser dev experience renders images.
  http.get(`${base}/items/:id/artwork/:kind`, ({ params }) =>
    new HttpResponse(artworkSvg(String(params.kind)), {
      headers: { 'Content-Type': 'image/svg+xml' },
    }),
  ),

  // Subtitle stub.
  http.get(`${base}/items/:id/subtitles/:file`, () =>
    new HttpResponse('WEBVTT\n\n', { headers: { 'Content-Type': 'text/vtt' } }),
  ),
];
