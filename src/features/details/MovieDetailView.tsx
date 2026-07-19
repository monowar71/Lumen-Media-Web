import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MovieDetail } from '@/api/types';
import { PosterImage } from '@/components/PosterImage';
import { Button } from '@/components/ui/Button';
import { Badge, Dot, MetaBadges } from '@/components/MetaBadges';
import { artworkUrl } from '@/lib/artwork';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useRefreshMetadata } from '@/api/queries';
import { formatRuntime } from '@/lib/format';
import { playerPath, type PlaybackNavState } from './playbackNav';

export function MovieDetailView({ movie }: { movie: MovieDetail }) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const refreshMeta = useRefreshMetadata();
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
    <div className="-mx-4 -mt-6">
      <div className="relative">
        {backdrop && (
          <div className="absolute inset-0 h-[380px] overflow-hidden">
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 pt-10">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="w-40 shrink-0 sm:w-56">
              <div className="aspect-[2/3] overflow-hidden rounded-xl shadow-2xl">
                <PosterImage
                  path={movie.artwork.poster}
                  alt={movie.title}
                  width={224}
                  height={336}
                  className="h-full"
                />
              </div>
            </div>

            <div className="flex-1 pt-2">
              <h1 className="text-3xl font-bold">{movie.title}</h1>
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
                {role === 'Admin' && (
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={refreshMeta.isPending}
                    onClick={() => refreshMeta.mutate(movie.id)}
                  >
                    {refreshMeta.isPending ? t('refreshing') : t('refreshMetadata')}
                  </Button>
                )}
              </div>

              {movie.overview && <p className="mt-5 max-w-3xl text-sm leading-6">{movie.overview}</p>}
            </div>
          </div>

          {movie.people && movie.people.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-semibold">{t('cast')}</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {movie.people.slice(0, 20).map((p, i) => (
                  <div key={`${p.name}-${i}`} className="w-28 shrink-0 text-center">
                    <div className="mx-auto mb-2 h-28 w-28 overflow-hidden rounded-full">
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
