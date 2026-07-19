import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@/api/queries';
import { MediaCard } from '@/components/MediaCard';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { formatRuntime } from '@/lib/format';

export function SearchScreen() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data, isLoading, isError, error, refetch } = useSearch(q);

  const movies = data?.movies ?? [];
  const series = data?.series ?? [];
  const episodes = data?.episodes ?? [];
  const empty = movies.length === 0 && series.length === 0 && episodes.length === 0;

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <h1 className="text-display mb-6 text-2xl font-extrabold sm:text-3xl">
        {t('search.title', { query: q })}
      </h1>
      {isLoading ? (
        <FullPageSpinner />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : empty ? (
        <EmptyState title={t('search.noResults')} />
      ) : (
        <div className="flex flex-col gap-8">
          {movies.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t('search.movies')}</h2>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {movies.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
          {series.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t('search.series')}</h2>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {series.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
          {episodes.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t('search.episodes')}</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <Link
                      to={`/item/${ep.seriesId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                    >
                      <span className="w-16 shrink-0 text-sm text-muted">
                        S{ep.seasonNumber}E{ep.episodeNumber}
                      </span>
                      <span className="flex-1 font-medium">
                        {ep.title ?? t('search.episodeFallback')}
                      </span>
                      {ep.runtimeMs != null && (
                        <span className="text-xs text-muted">
                          {formatRuntime(Number(ep.runtimeMs))}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
