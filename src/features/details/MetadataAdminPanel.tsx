import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useMatchCandidates,
  useMatchItem,
  useRefreshMetadata,
  useUpdateItemMetadata,
} from '@/api/queries';
import type { MetadataMatchCandidateDto, UpdateItemMetadataRequest } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/api/http';
import { cn } from '@/lib/utils';

export interface EditableMetadata {
  id: string;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  overview?: string | null;
  tagline?: string | null;
  communityRating?: number | null;
  officialRating?: string | null;
  metadataLocked?: boolean;
  kind: 'Movie' | 'Series';
  externalIds?: { tmdb?: string | null; tvdb?: string | null; imdb?: string | null };
}

type Panel = 'none' | 'edit' | 'match';

export function MetadataAdminPanel({ item }: { item: EditableMetadata }) {
  const { t } = useTranslation('details');
  const [panel, setPanel] = useState<Panel>('none');
  const refresh = useRefreshMetadata();

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          variant="secondary"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate(item.id)}
        >
          {refresh.isPending ? t('refreshing') : t('refreshMetadata')}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setPanel('edit')}>
          {t('editMetadata')}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setPanel('match')}>
          {t('fixMatch')}
        </Button>
      </div>
      {item.metadataLocked && (
        <p className="text-xs text-accent">{t('metadataLockedHint')}</p>
      )}
      {(item.externalIds?.tmdb || item.externalIds?.tvdb || item.externalIds?.imdb) && (
        <p className="text-xs text-muted">
          {[
            item.externalIds.tmdb && `TMDB ${item.externalIds.tmdb}`,
            item.externalIds.tvdb && `TVDB ${item.externalIds.tvdb}`,
            item.externalIds.imdb && item.externalIds.imdb,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {panel === 'edit' && <EditMetadataDialog item={item} onClose={() => setPanel('none')} />}
      {panel === 'match' && <FixMatchDialog item={item} onClose={() => setPanel('none')} />}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl',
          wide ? 'max-w-2xl' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2 hover:text-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditMetadataDialog({ item, onClose }: { item: EditableMetadata; onClose: () => void }) {
  const { t } = useTranslation('details');
  const save = useUpdateItemMetadata();
  const [title, setTitle] = useState(item.title);
  const [originalTitle, setOriginalTitle] = useState(item.originalTitle ?? '');
  const [year, setYear] = useState(item.year != null ? String(item.year) : '');
  const [overview, setOverview] = useState(item.overview ?? '');
  const [tagline, setTagline] = useState(item.tagline ?? '');
  const [rating, setRating] = useState(
    typeof item.communityRating === 'number' ? String(item.communityRating) : '',
  );
  const [officialRating, setOfficialRating] = useState(item.officialRating ?? '');
  const [locked, setLocked] = useState(item.metadataLocked ?? true);
  const [error, setError] = useState<string | null>(null);

  return (
    <ModalShell title={t('editMetadata')} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!title.trim()) {
            setError(t('titleRequired'));
            return;
          }
          const body: UpdateItemMetadataRequest = {
            title: title.trim(),
            originalTitle,
            overview,
            officialRating,
            metadataLocked: locked,
            year: year.trim() ? Number(year) : 0,
            communityRating: rating.trim() ? Number(rating) : undefined,
          };
          if (item.kind === 'Movie') body.tagline = tagline;
          save.mutate(
            { itemId: item.id, body },
            {
              onSuccess: () => onClose(),
              onError: (err) => setError(toErrorMessage(err)),
            },
          );
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('fields.title')}</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('fields.originalTitle')}</span>
          <Input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('fields.year')}</span>
            <Input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('fields.communityRating')}</span>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} inputMode="decimal" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('fields.officialRating')}</span>
          <Input value={officialRating} onChange={(e) => setOfficialRating(e.target.value)} />
        </label>
        {item.kind === 'Movie' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('fields.tagline')}</span>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('fields.overview')}</span>
          <textarea
            className="min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
          <span>{t('fields.lockMetadata')}</span>
        </label>
        <p className="text-xs text-muted">{t('lockHint')}</p>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function FixMatchDialog({ item, onClose }: { item: EditableMetadata; onClose: () => void }) {
  const { t } = useTranslation('details');
  const [query, setQuery] = useState(item.title);
  const [year, setYear] = useState(item.year != null ? String(item.year) : '');
  const [searchKey, setSearchKey] = useState({ q: item.title, year: item.year ?? undefined });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMatchCandidates(item.id, searchKey.q, searchKey.year, true);
  const match = useMatchItem();

  useEffect(() => {
    setSearchKey({ q: item.title, year: item.year ?? undefined });
  }, [item.id, item.title, item.year]);

  const apply = (c: MetadataMatchCandidateDto) => {
    setError(null);
    setMessage(null);
    match.mutate(
      { itemId: item.id, provider: c.provider, providerId: c.providerId },
      {
        onSuccess: () => {
          setMessage(t('matchQueued', { title: c.title, provider: c.provider }));
          window.setTimeout(onClose, 900);
        },
        onError: (err) => setError(toErrorMessage(err)),
      },
    );
  };

  return (
    <ModalShell title={t('fixMatch')} onClose={onClose} wide>
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchKey({
            q: query.trim() || item.title,
            year: year.trim() ? Number(year) : undefined,
          });
        }}
      >
        <Input
          className="flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
        />
        <Input
          className="w-full sm:w-24"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder={t('fields.year')}
          inputMode="numeric"
        />
        <Button type="submit" disabled={candidates.isFetching}>
          {candidates.isFetching ? t('searching') : t('search')}
        </Button>
      </form>

      {candidates.isError && (
        <p className="mb-3 text-sm text-red-400">{toErrorMessage(candidates.error)}</p>
      )}
      {message && <p className="mb-3 text-sm text-accent">{message}</p>}
      {error && (
        <p className="mb-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {(candidates.data ?? []).length === 0 && !candidates.isFetching && (
          <li className="px-4 py-6 text-center text-sm text-muted">{t('noCandidates')}</li>
        )}
        {(candidates.data ?? []).map((c) => (
          <li key={`${c.provider}-${c.providerId}`} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {c.title}
                {c.year ? ` (${c.year})` : ''}
              </p>
              <p className="text-xs text-muted">
                {c.provider} · {c.providerId} · {(c.score * 100).toFixed(0)}%
              </p>
            </div>
            <Button
              size="sm"
              disabled={match.isPending}
              onClick={() => apply(c)}
            >
              {t('applyMatch')}
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('fixMatchHint')}</p>
    </ModalShell>
  );
}
