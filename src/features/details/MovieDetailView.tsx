import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MovieDetail } from '@/api/types';
import { PosterImage } from '@/components/PosterImage';
import { Button } from '@/components/ui/Button';
import { Badge, Dot, MetaBadges } from '@/components/MetaBadges';
import { artworkUrl } from '@/lib/artwork';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRuntime } from '@/lib/format';
import { playerPath, type PlaybackNavState } from './playbackNav';
import { MetadataAdminPanel } from './MetadataAdminPanel';
import { WatchedToggle } from './WatchedToggle';

export function MovieDetailView({ movie }: { movie: MovieDetail }) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const backdrop = artworkUrl(baseUrl, movie.artwork.backdrop, { w: 1280, h: 720, quality: 70 }, token);

  const resumeMs = movie.userData.playbackPositionMs ?? 0;
  const canResume = resumeMs > 0 && !movie.userData.watched;

  const play = (fromStart: boolean) => {
    const state: PlaybackNavState = {
      title: movie.title,
      mediaSourceId: movie.mediaSources[0]?.id,
      resumeMs: fromStart ? 0 : resumeMs,
      isEpisode: false,
      backdrop: movie.artwork.backdrop,
    };
    navigate(playerPath(movie.id), { state });
  };

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
                  path={movie.artwork.poster}
                  alt={movie.title}
                  width={208}
                  height={312}
                  className="h-full"
                />
              </div>
            </div>

            <div className="flex-1 pt-1">
              <h1 className="text-display text-3xl font-extrabold sm:text-4xl">{movie.title}</h1>
              {movie.tagline && <p className="mt-1 italic text-muted">{movie.tagline}</p>}

              <div className="mt-3">
                <MetaBadges>
                  {movie.year && <span>{movie.year}</span>}
                  {movie.runtimeMs && (
                    <>
                      <Dot />
                      <span>{formatRuntime(movie.runtimeMs)}</span>
                    </>
                  )}
                  {movie.officialRating && (
                    <>
                      <Dot />
                      <Badge>{movie.officialRating}</Badge>
                    </>
                  )}
                  {typeof movie.communityRating === 'number' && (
                    <>
                      <Dot />
                      <span>★ {movie.communityRating.toFixed(1)}</span>
                    </>
                  )}
                  {movie.userData.watched && (
                    <>
                      <Dot />
                      <span className="text-accent">{t('watched')}</span>
                    </>
                  )}
                </MetaBadges>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <Badge key={g}>{g}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => play(!canResume)}>
                  {canResume
                    ? t('resume', { time: formatRuntime(resumeMs) })
                    : t('play')}
                </Button>
                {canResume && (
                  <Button size="lg" variant="secondary" onClick={() => play(true)}>
                    {t('playFromStart')}
                  </Button>
                )}
                <WatchedToggle itemId={movie.id} watched={Boolean(movie.userData.watched)} />
                {movie.trailerUrl && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => window.open(movie.trailerUrl!, '_blank', 'noopener')}
                  >
                    {t('trailer')}
                  </Button>
                )}
              </div>

              {role === 'Admin' && (
                <MetadataAdminPanel
                  item={{
                    id: movie.id,
                    kind: 'Movie',
                    title: movie.title,
                    originalTitle: movie.originalTitle,
                    year: movie.year,
                    overview: movie.overview,
                    tagline: movie.tagline,
                    communityRating: movie.communityRating,
                    officialRating: movie.officialRating,
                    metadataLocked: movie.metadataLocked,
                    externalIds: movie.externalIds,
                  }}
                />
              )}

              {movie.overview && (
                <p className="mt-5 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:text-text/90">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>

          {movie.people && movie.people.length > 0 && (
            <section className="mt-10">
              <h2 className="text-display mb-3 text-lg font-bold">{t('cast')}</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {movie.people.slice(0, 20).map((p, i) => (
                  <div key={`${p.name}-${i}`} className="w-28 shrink-0 text-center">
                    <div className="mx-auto mb-2 h-28 w-28 overflow-hidden rounded-full ring-1 ring-white/10">
                      <PosterImage path={p.thumb} alt={p.name} width={112} height={112} rounded />
                    </div>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.role && <p className="truncate text-xs text-muted">{p.role}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
