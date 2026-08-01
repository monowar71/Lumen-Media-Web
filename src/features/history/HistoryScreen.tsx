import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  useClearHistory,
  useHistory,
  useImportPlexHistory,
} from '@/api/queries';
import { toErrorMessage } from '@/api/http';
import type { HistoryEntry, ImportPlexHistoryResponse } from '@/api/types';
import { PosterImage } from '@/components/PosterImage';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { formatRuntime, intlLocale, progressFraction } from '@/lib/format';
import { cn } from '@/lib/utils';

export function HistoryScreen() {
  const { t } = useTranslation('common');
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useHistory();
  const clearMutation = useClearHistory();
  const importMutation = useImportPlexHistory();

  const [plexUrl, setPlexUrl] = useState('');
  const [plexToken, setPlexToken] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<ImportPlexHistoryResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const onClear = async () => {
    if (!window.confirm(t('history.clearConfirm'))) return;
    setActionError(null);
    try {
      await clearMutation.mutateAsync();
    } catch (err) {
      setActionError(toErrorMessage(err));
    }
  };

  const onImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setImportResult(null);
    try {
      const result = await importMutation.mutateAsync({
        baseUrl: plexUrl.trim(),
        token: plexToken.trim(),
      });
      setImportResult(result);
      setPlexToken('');
    } catch (err) {
      setActionError(toErrorMessage(err));
    }
  };

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display text-2xl font-extrabold sm:text-3xl">{t('history.title')}</h1>
          <p className="mt-1 text-sm text-muted">
            {total > 0 ? t('history.count', { count: total }) : t('history.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowImport((v) => !v)}
          >
            {t('history.importPlex')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={total === 0 || clearMutation.isPending}
            onClick={() => void onClear()}
          >
            {clearMutation.isPending ? t('history.clearing') : t('history.clear')}
          </Button>
        </div>
      </div>

      {showImport && (
        <section className="mb-6 rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-semibold">{t('history.importTitle')}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{t('history.importBody')}</p>
          <form className="flex flex-col gap-3" onSubmit={(e) => void onImport(e)}>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{t('history.plexUrl')}</span>
              <Input
                value={plexUrl}
                onChange={(e) => setPlexUrl(e.target.value)}
                placeholder="http://192.168.0.10:32400"
                autoComplete="off"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{t('history.plexToken')}</span>
              <Input
                value={plexToken}
                onChange={(e) => setPlexToken(e.target.value)}
                type="password"
                autoComplete="off"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={importMutation.isPending}>
                {importMutation.isPending ? t('history.importing') : t('history.importSubmit')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowImport(false)}>
                {t('history.cancel')}
              </Button>
            </div>
          </form>
          {importResult && (
            <p className="mt-3 text-sm text-muted" role="status">
              {t('history.importResult', {
                scanned: importResult.scanned,
                matched: importResult.matched,
                imported: importResult.imported,
                skipped: importResult.skippedNewer,
                unmatched: importResult.unmatched,
              })}
            </p>
          )}
        </section>
      )}

      {actionError && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState title={t('history.emptyTitle')}>{t('history.emptyBody')}</EmptyState>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((entry) => (
              <HistoryRow
                key={
                  entry.isExternal
                    ? `ext:${entry.externalKey ?? entry.title}:${entry.updatedAt}`
                    : `${entry.itemId}-${entry.updatedAt}`
                }
                entry={entry}
              />
            ))}
          </ul>
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? t('state.loading') : t('history.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { t } = useTranslation('common');
  const external = Boolean(entry.isExternal);
  const href =
    !external && entry.itemId
      ? entry.kind === 'Episode' && entry.seriesId
        ? `/item/${entry.seriesId}`
        : `/item/${entry.itemId}`
      : null;
  const fraction = progressFraction(entry.positionMs, entry.durationMs);
  const when = new Date(entry.updatedAt).toLocaleString(intlLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subtitleParts: string[] = [];
  if (entry.kind === 'Episode') {
    if (entry.seriesTitle) subtitleParts.push(entry.seriesTitle);
    if (entry.seasonNumber != null && entry.episodeNumber != null) {
      subtitleParts.push(
        t('history.episodeLabel', {
          season: entry.seasonNumber,
          episode: entry.episodeNumber,
        }),
      );
    }
  } else if (entry.year) {
    subtitleParts.push(String(entry.year));
  }
  if (external) subtitleParts.push(t('history.notInLibrary'));
  else if (entry.watched) subtitleParts.push(t('badge.watched'));
  else if (fraction > 0) subtitleParts.push(formatRuntime(entry.positionMs));

  const body = (
    <>
      <div className="relative h-[90px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-surface-2">
        <PosterImage
          path={entry.artwork.poster ?? entry.artwork.thumb}
          alt={entry.title}
          width={60}
          height={90}
          className="h-full"
        />
        {fraction > 0 && !entry.watched && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${fraction * 100}%` }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate font-semibold text-text">{entry.title}</p>
        {subtitleParts.length > 0 && (
          <p className="mt-0.5 truncate text-sm text-muted">{subtitleParts.join(' · ')}</p>
        )}
        <p className="mt-1 text-xs text-muted/80">{when}</p>
      </div>
    </>
  );

  const rowClass = cn(
    'flex gap-3 rounded-xl border border-border bg-surface/60 p-2.5 transition-colors',
    external
      ? 'cursor-default opacity-55 grayscale'
      : 'hover:border-accent/50 hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  );

  return (
    <li>
      {href ? (
        <Link to={href} className={rowClass}>
          {body}
        </Link>
      ) : (
        <div className={rowClass} aria-disabled="true">
          {body}
        </div>
      )}
    </li>
  );
}
