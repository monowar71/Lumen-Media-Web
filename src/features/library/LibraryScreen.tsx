import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLibrary, useLibraryItems } from '@/api/queries';
import type { LibraryItemsQuery } from '@/api/endpoints';
import { VirtualPosterGrid } from '@/components/VirtualPosterGrid';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/StateViews';
import { Input } from '@/components/ui/Input';

type SortKey = NonNullable<LibraryItemsQuery['sort']>;
type OrderKey = NonNullable<LibraryItemsQuery['order']>;

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'year', label: 'Year' },
  { value: 'added', label: 'Date added' },
  { value: 'rating', label: 'Rating' },
  { value: 'runtime', label: 'Runtime' },
];

const GENRES = [
  '',
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
];

export function LibraryScreen() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const { data: library } = useLibrary(libraryId);

  const [sort, setSort] = useState<SortKey>('title');
  const [order, setOrder] = useState<OrderKey>('asc');
  const [watched, setWatched] = useState<'' | 'true' | 'false'>('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');

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
    'h-10 rounded-lg border border-border bg-surface px-2 text-sm text-text focus:border-accent focus:outline-none';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{library?.name ?? 'Library'}</h1>
          {!isLoading && <p className="text-sm text-muted">{total} items</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Filter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter items"
            className="w-40"
          />
          <label className="sr-only" htmlFor="genre">
            Genre
          </label>
          <select
            id="genre"
            className={selectClass}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All genres</option>
            {GENRES.filter(Boolean).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="year">
            Year
          </label>
          <Input
            id="year"
            type="number"
            inputMode="numeric"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Filter by year"
            className="w-24"
            min={1900}
            max={2100}
          />
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={selectClass}
            onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            aria-label={`Order: ${order === 'asc' ? 'ascending' : 'descending'}`}
          >
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <label className="sr-only" htmlFor="watched">
            Watched filter
          </label>
          <select
            id="watched"
            className={selectClass}
            value={watched}
            onChange={(e) => setWatched(e.target.value as '' | 'true' | 'false')}
          >
            <option value="">All</option>
            <option value="false">Unwatched</option>
            <option value="true">Watched</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No items match your filters" />
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
