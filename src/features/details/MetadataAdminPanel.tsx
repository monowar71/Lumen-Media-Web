import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useArtworkCandidates,
  useMatchCandidates,
  useMatchItem,
  useSetItemArtwork,
  useUpdateItemMetadata,
} from '@/api/queries';
import type {
  ArtworkCandidateDto,
  ArtworkKindParam,
  MetadataMatchCandidateDto,
  UpdateItemMetadataRequest,
} from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/api/http';
import { artworkUrl } from '@/lib/artwork';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

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
  artwork?: { poster?: string | null; backdrop?: string | null };
}

export type MetadataAdminPanelKind = 'none' | 'edit' | 'match';

/** Dialogs for admin metadata actions (opened from the overflow menu). */
export function MetadataAdminDialogs({
  item,
  panel,
  onPanelChange,
}: {
  item: EditableMetadata;
  panel: MetadataAdminPanelKind;
  onPanelChange: (panel: MetadataAdminPanelKind) => void;
}) {
  return (
    <>
      {panel === 'edit' && (
        <EditMetadataDialog item={item} onClose={() => onPanelChange('none')} />
      )}
      {panel === 'match' && <FixMatchDialog item={item} onClose={() => onPanelChange('none')} />}
    </>
  );
}

export function MetadataAdminHints({ item }: { item: EditableMetadata }) {
  const { t } = useTranslation('details');
  const hasIds = Boolean(
    item.externalIds?.tmdb || item.externalIds?.tvdb || item.externalIds?.imdb,
  );
  if (!item.metadataLocked && !hasIds) return null;

  return (
    <div className="mt-3 space-y-1">
      {item.metadataLocked && (
        <p className="text-xs text-accent">{t('metadataLockedHint')}</p>
      )}
      {hasIds && (
        <p className="text-xs text-muted">
          {[
            item.externalIds?.tmdb && `TMDB ${item.externalIds.tmdb}`,
            item.externalIds?.tvdb && `TVDB ${item.externalIds.tvdb}`,
            item.externalIds?.imdb && item.externalIds.imdb,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
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
          wide ? 'max-w-3xl' : 'max-w-lg',
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
    <ModalShell title={t('editMetadata')} onClose={onClose} wide>
      <CoverPicker item={item} />
      <form
        className="mt-5 grid gap-3 border-t border-border pt-5"
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

function CoverPicker({ item }: { item: EditableMetadata }) {
  const { t } = useTranslation('details');
  const token = useAuthStore((s) => s.accessToken);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const [kind, setKind] = useState<ArtworkKindParam>('Poster');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasTmdb = Boolean(item.externalIds?.tmdb);

  const candidates = useArtworkCandidates(item.id, kind, hasTmdb);
  const setArtwork = useSetItemArtwork();

  const currentPath = kind === 'Poster' ? item.artwork?.poster : item.artwork?.backdrop;
  const currentSrc = artworkUrl(
    baseUrl,
    currentPath ?? undefined,
    { w: 185, h: 278, quality: 70 },
    token,
  );

  const apply = (c: ArtworkCandidateDto) => {
    setError(null);
    setMessage(null);
    setSelectedUrl(c.url);
    setArtwork.mutate(
      { itemId: item.id, kind, body: { url: c.url } },
      {
        onSuccess: () => setMessage(t('coverApplied')),
        onError: (err) => {
          setSelectedUrl(null);
          setError(toErrorMessage(err));
        },
      },
    );
  };

  return (
    <section aria-labelledby="cover-picker-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="cover-picker-title" className="text-sm font-semibold">
            {t('changeCover')}
          </h3>
          <p className="text-xs text-muted">{t('changeCoverHint')}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {(['Poster', 'Backdrop'] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium',
                kind === k ? 'bg-accent text-on-accent' : 'text-muted hover:text-text',
              )}
              onClick={() => {
                setKind(k);
                setSelectedUrl(null);
                setMessage(null);
                setError(null);
              }}
            >
              {k === 'Poster' ? t('coverPoster') : t('coverBackdrop')}
            </button>
          ))}
        </div>
      </div>

      {!hasTmdb ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted">
          {t('coverNeedsMatch')}
        </p>
      ) : candidates.isLoading ? (
        <p className="text-sm text-muted">{t('loadingCovers')}</p>
      ) : candidates.isError ? (
        <p className="text-sm text-red-400">{toErrorMessage(candidates.error)}</p>
      ) : (candidates.data ?? []).length === 0 ? (
        <p className="text-sm text-muted">{t('noCovers')}</p>
      ) : (
        <div
          className={cn(
            'grid gap-2',
            kind === 'Poster' ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3',
          )}
        >
          {currentSrc && (
            <div className="relative overflow-hidden rounded-lg ring-2 ring-accent/60">
              <img src={currentSrc} alt="" className="aspect-[2/3] w-full object-cover opacity-90" />
              <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-center text-[10px] font-medium text-accent">
                {t('currentCover')}
              </span>
            </div>
          )}
          {(candidates.data ?? []).map((c) => {
            const active = selectedUrl === c.url;
            return (
              <button
                key={c.url}
                type="button"
                disabled={setArtwork.isPending}
                onClick={() => apply(c)}
                className={cn(
                  'overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active && 'ring-2 ring-accent',
                )}
                aria-label={t('selectCover', { lang: c.language ?? '—' })}
              >
                <img
                  src={c.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className={cn(
                    'w-full object-cover',
                    kind === 'Poster' ? 'aspect-[2/3]' : 'aspect-video',
                  )}
                />
              </button>
            );
          })}
        </div>
      )}

      {setArtwork.isPending && <p className="mt-2 text-xs text-muted">{t('applyingCover')}</p>}
      {message && <p className="mt-2 text-xs text-accent">{message}</p>}
      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
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
            <Button size="sm" disabled={match.isPending} onClick={() => apply(c)}>
              {t('applyMatch')}
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('fixMatchHint')}</p>
    </ModalShell>
  );
}
