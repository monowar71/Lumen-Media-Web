import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLibrary, useLibraryItems } from '@/api/queries';
import type { LibraryItemsQuery } from '@/api/endpoints';
import { VirtualPosterGrid } from '@/components/VirtualPosterGrid';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/StateViews';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconFilter } from '@/components/AppIcons';
import { cn } from '@/lib/utils';
import {
  useLibraryUiStore,
  type LibrarySortKey,
} from '@/stores/libraryUiStore';

const SORT_KEYS: LibrarySortKey[] = ['title', 'year', 'added', 'rating', 'runtime'];

const GENRE_KEYS = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
] as const;

export function LibraryScreen() {
  const { t } = useTranslation('library');
  const { libraryId } = useParams<{ libraryId: string }>();
  const { data: library } = useLibrary(libraryId);

  const sort = useLibraryUiStore((s) => s.sort);
  const order = useLibraryUiStore((s) => s.order);
  const setSort = useLibraryUiStore((s) => s.setSort);
  const toggleOrder = useLibraryUiStore((s) => s.toggleOrder);
  const [watched, setWatched] = useState<'' | 'true' | 'false'>('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [search, genre, year, watched].filter(Boolean).length;

  const query = useMemo<Omit<LibraryItemsQuery, 'page'>>(
    () => ({
      sort,
      order,
      ...(watched !== '' ? { watched: watched === 'true' } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(genre ? { genre } : {}),
      ...(year.trim() ? { year: Number(year) } : {}),
    }),
    [sort, order, watched, search, genre, year],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useLibraryItems(libraryId, query);

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const selectClass =
    'h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent focus:outline-none';

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-extrabold sm:text-3xl">
            {library?.name ?? t('title')}
          </h1>
          {!isLoading && <p className="text-sm text-muted">{t('itemsCount', { count: total })}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className={cn(selectClass, 'w-auto min-w-[8rem]')}
            value={sort}
            onChange={(e) => setSort(e.target.value as LibrarySortKey)}
            aria-label={t('sortBy')}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`sort.${key}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cn(selectClass, 'w-auto px-3')}
            onClick={toggleOrder}
            aria-label={order === 'asc' ? t('orderAriaAsc') : t('orderAriaDesc')}
          >
            {order === 'asc' ? t('orderAsc') : t('orderDesc')}
          </button>
          <Button
            size="sm"
            variant={filtersOpen || activeFilterCount > 0 ? 'primary' : 'secondary'}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <IconFilter size={16} />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-black/20 px-1.5 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="mb-5 grid gap-3 rounded-xl border border-border bg-surface/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="search"
            placeholder={t('filterPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('filterAria')}
          />
          <select
            className={selectClass}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            aria-label={t('genre')}
          >
            <option value="">{t('allGenres')}</option>
            {GENRE_KEYS.map((g) => (
              <option key={g} value={g}>
                {t(`genres.${g}`)}
              </option>
            ))}
          </select>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t('year')}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label={t('yearAria')}
            min={1900}
            max={2100}
          />
          <select
            className={selectClass}
            value={watched}
            onChange={(e) => setWatched(e.target.value as '' | 'true' | 'false')}
            aria-label={t('watchedFilter')}
          >
            <option value="">{t('all')}</option>
            <option value="false">{t('unwatched')}</option>
            <option value="true">{t('watched')}</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <FullPageSpinner />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t('noMatch')} />
      ) : (
        <VirtualPosterGrid
          items={items}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => void fetchNextPage()}
        />
      )}
    </div>
  );
}
