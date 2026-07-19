import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EpisodeSummary, SeriesDetail } from '@/api/types';
import { useEpisodes, useRefreshMetadata, useSeasons } from '@/api/queries';
import { PosterImage } from '@/components/PosterImage';
import { Button } from '@/components/ui/Button';
import { Badge, Dot, MetaBadges } from '@/components/MetaBadges';
import { Spinner } from '@/components/ui/Spinner';
import { formatRuntime, progressFraction } from '@/lib/format';
import { playerPath, type PlaybackNavState } from './playbackNav';
import { useAuthStore } from '@/stores/authStore';

function RefreshMetadataButton({ itemId }: { itemId: string }) {
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
      {refresh.isPending ? 'Refreshing…' : 'Refresh metadata'}
    </Button>
  );
}

export function SeriesDetailView({ series }: { series: SeriesDetail }) {
  const navigate = useNavigate();
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
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0 sm:w-56">
          <div className="aspect-[2/3] overflow-hidden rounded-xl shadow-2xl">
            <PosterImage
              path={series.artwork.poster}
              alt={series.title}
              width={224}
              height={336}
              className="h-full"
            />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{series.title}</h1>
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
              <span>{series.seasonCount} seasons</span>
            </MetaBadges>
          </div>
          {series.genres && series.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
          )}
          {series.overview && <p className="mt-4 max-w-3xl text-sm leading-6">{series.overview}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            {series.userData.nextUp && (
              <Button
                onClick={() => {
                  const next = series.userData.nextUp!;
                  const state: PlaybackNavState = {
                    title:
                      next.title?.trim() ||
                      `${series.title} — S${next.seasonNumber}E${next.episodeNumber}`,
                    resumeMs: next.userData?.playbackPositionMs ?? 0,
                    isEpisode: true,
                  };
                  navigate(playerPath(next.id), { state });
                }}
              >
                Play next episode
              </Button>
            )}
            <RefreshMetadataButton itemId={series.id} />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold">Episodes</h2>
          {seasons.length > 0 && (
            <select
              className="h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none"
              value={seasonId ?? ''}
              onChange={(e) => setSeasonId(e.target.value)}
              aria-label="Select season"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {seasonsLoading || episodesLoading ? (
          <div className="py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
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
    <li className="flex gap-4 rounded-xl border border-border bg-surface p-3">
      <div className="relative w-40 shrink-0 overflow-hidden rounded-lg">
        <div className="aspect-video">
          <PosterImage
            path={episode.artwork?.thumb ?? episode.artwork?.poster}
            alt={episodeLabel}
            width={220}
            height={124}
            className="h-full"
          />
        </div>
        {fraction > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${fraction * 100}%` }} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">
            {episode.episodeNumber}. {episode.title?.trim() || `Episode ${episode.episodeNumber}`}
          </p>
          {episode.userData.watched && <span className="text-xs text-accent">Watched</span>}
        </div>
        {episode.runtimeMs && (
          <p className="text-xs text-muted">{formatRuntime(episode.runtimeMs)}</p>
        )}
        {episode.overview && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{episode.overview}</p>
        )}
        <div className="mt-auto pt-2">
          <Button size="sm" onClick={play}>
            {canResume ? '▶ Resume' : '▶ Play'}
          </Button>
        </div>
      </div>
    </li>
  );
}
