import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EpisodeSummary, SeriesDetail } from '@/api/types';
import { useEpisodes, useRefreshMetadata, useSeasons } from '@/api/queries';
import { PosterImage } from '@/components/PosterImage';
import { Button } from '@/components/ui/Button';
import { Badge, Dot, MetaBadges } from '@/components/MetaBadges';
import { Spinner } from '@/components/ui/Spinner';
import { IconPlay } from '@/components/AppIcons';
import { artworkUrl } from '@/lib/artwork';
import { formatRuntime, progressFraction } from '@/lib/format';
import { playerPath, type PlaybackNavState } from './playbackNav';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';

function RefreshMetadataButton({ itemId }: { itemId: string }) {
  const { t } = useTranslation('details');
  const role = useAuthStore((s) => s.user?.role);
  const refresh = useRefreshMetadata();
  if (role !== 'Admin') return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={refresh.isPending}
      onClick={() => refresh.mutate(itemId)}
    >
      {refresh.isPending ? t('refreshing') : t('refreshMetadata')}
    </Button>
  );
}

export function SeriesDetailView({ series }: { series: SeriesDetail }) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const backdrop = artworkUrl(
    baseUrl,
    series.artwork.backdrop ?? series.artwork.poster,
    { w: 1280, h: 720, quality: 70 },
    token,
  );

  const { data: seasonsData, isLoading: seasonsLoading } = useSeasons(series.id);
  const seasons = useMemo(() => seasonsData?.items ?? [], [seasonsData]);
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!seasonId && seasons.length > 0) setSeasonId(seasons[0].id);
  }, [seasons, seasonId]);

  const { data: episodesData, isLoading: episodesLoading } = useEpisodes(seasonId);
  const episodes = episodesData?.items ?? [];

  return (
    <div>
      <div className="relative">
        {backdrop && (
          <div className="absolute inset-0 h-[min(52vw,420px)] overflow-hidden">
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-45" />
            <div className="hero-scrim absolute inset-0" />
          </div>
        )}

        <div className="relative px-4 pb-6 pt-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="w-36 shrink-0 sm:w-52">
              <div className="aspect-[2/3] overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <PosterImage
                  path={series.artwork.poster}
                  alt={series.title}
                  width={208}
                  height={312}
                  className="h-full"
                />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-display text-3xl font-extrabold sm:text-4xl">{series.title}</h1>
              <div className="mt-3">
                <MetaBadges>
                  {series.year && (
                    <span>
                      {series.year}
                      {series.endYear ? `–${series.endYear}` : ''}
                    </span>
                  )}
                  {series.status && (
                    <>
                      <Dot />
                      <span>{series.status}</span>
                    </>
                  )}
                  {series.officialRating && (
                    <>
                      <Dot />
                      <Badge>{series.officialRating}</Badge>
                    </>
                  )}
                  {typeof series.communityRating === 'number' && (
                    <>
                      <Dot />
                      <span>★ {series.communityRating.toFixed(1)}</span>
                    </>
                  )}
                  <Dot />
                  <span>{t('seasonsCount', { count: series.seasonCount })}</span>
                </MetaBadges>
              </div>
              {series.genres && series.genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {series.genres.map((g) => (
                    <Badge key={g}>{g}</Badge>
                  ))}
                </div>
              )}
              {series.overview && (
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:text-text/90">
                  {series.overview}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                {series.userData.nextUp && (
                  <Button
                    size="lg"
                    onClick={() => {
                      const next = series.userData.nextUp!;
                      const state: PlaybackNavState = {
                        title:
                          next.title?.trim() ||
                          `${series.title} — S${next.seasonNumber}E${next.episodeNumber}`,
                        resumeMs: next.userData?.playbackPositionMs ?? 0,
                        isEpisode: true,
                        backdrop: series.artwork.backdrop,
                      };
                      navigate(playerPath(next.id), { state });
                    }}
                  >
                    <IconPlay size={18} />
                    {t('playNextEpisode')}
                  </Button>
                )}
                <RefreshMetadataButton itemId={series.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-display text-lg font-bold">{t('episodes')}</h2>
          {seasons.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeasonId(s.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    seasonId === s.id
                      ? 'bg-accent text-black'
                      : 'bg-surface-2 text-muted hover:text-text',
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {seasonsLoading || episodesLoading ? (
          <div className="py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="flex flex-col gap-2 pb-8">
            {episodes.map((ep) => (
              <EpisodeRow key={ep.id} episode={ep} seriesTitle={series.title} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EpisodeRow({
  episode,
  seriesTitle,
}: {
  episode: EpisodeSummary;
  seriesTitle: string;
}) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const resumeMs = episode.userData.playbackPositionMs ?? 0;
  const fraction = progressFraction(resumeMs, episode.runtimeMs);
  const canResume = resumeMs > 0 && !episode.userData.watched;
  const episodeLabel =
    episode.title?.trim() ||
    `${seriesTitle} — S${episode.seasonNumber}E${episode.episodeNumber}`;

  const play = () => {
    const state: PlaybackNavState = {
      title: episode.title?.trim()
        ? `${episode.title} — S${episode.seasonNumber}E${episode.episodeNumber}`
        : episodeLabel,
      resumeMs: canResume ? resumeMs : 0,
      isEpisode: true,
    };
    navigate(playerPath(episode.id), { state });
  };

  return (
    <li className="group flex gap-3 rounded-xl bg-surface/60 p-2.5 transition hover:bg-surface-2 sm:gap-4 sm:p-3">
      <button
        type="button"
        onClick={play}
        className="relative w-32 shrink-0 overflow-hidden rounded-lg sm:w-44"
      >
        <div className="aspect-video">
          <PosterImage
            path={episode.artwork?.thumb ?? episode.artwork?.poster}
            alt={episodeLabel}
            width={220}
            height={124}
            className="h-full"
          />
        </div>
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-black">
            <IconPlay size={18} />
          </span>
        </span>
        {fraction > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${fraction * 100}%` }} />
          </div>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">
            <span className="text-muted">{episode.episodeNumber}. </span>
            {episode.title?.trim() || t('episodeN', { number: episode.episodeNumber })}
          </p>
          {episode.userData.watched && (
            <span className="shrink-0 text-xs text-accent">{t('watched')}</span>
          )}
        </div>
        {episode.runtimeMs && (
          <p className="text-xs text-muted">{formatRuntime(episode.runtimeMs)}</p>
        )}
        {episode.overview && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{episode.overview}</p>
        )}
        <div className="mt-auto pt-2">
          <Button size="sm" variant="secondary" onClick={play}>
            {canResume ? t('resumeShort') : t('play')}
          </Button>
        </div>
      </div>
    </li>
  );
}
