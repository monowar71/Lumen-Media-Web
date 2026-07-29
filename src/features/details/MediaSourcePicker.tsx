import { useTranslation } from 'react-i18next';
import type { MediaSource } from '@/api/types';
import { mediaSourceLabel } from '@/lib/mediaSourceLabel';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

type Props = {
  sources: MediaSource[];
  loading?: boolean;
  onSelect: (sourceId: string) => void;
  onClose: () => void;
};

/** Modal to choose which media file/version to play when several exist. */
export function MediaSourcePicker({ sources, loading, onSelect, onClose }: Props) {
  const { t } = useTranslation('details');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label={t('cancel')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-label={t('chooseVersion')}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t('chooseVersion')}</h2>
            <p className="mt-1 text-sm text-muted">{t('chooseVersionHint')}</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2 hover:text-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sources.map((source, index) => {
              const label = mediaSourceLabel(source, index);
              return (
                <li key={source.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(source.id)}
                    className={cn(
                      'w-full rounded-xl border border-border bg-surface-2/40 px-4 py-3 text-left transition',
                      'hover:border-accent/50 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    )}
                  >
                    <span className="block truncate font-medium">{label.title}</span>
                    {(label.video || label.audio) && (
                      <span className="mt-1 block space-y-0.5 text-sm text-muted">
                        {label.video && (
                          <span className="block truncate">
                            <span className="text-text/70">{t('mediaVideo')}: </span>
                            {label.video}
                          </span>
                        )}
                        {label.audio && (
                          <span className="block truncate">
                            <span className="text-text/70">{t('mediaAudio')}: </span>
                            {label.audio}
                            {label.extraAudioTracks > 0
                              ? ` ${t('mediaExtraAudio', { count: label.extraAudioTracks })}`
                              : ''}
                          </span>
                        )}
                      </span>
                    )}
                    {label.subtitle && (
                      <span className="mt-0.5 block truncate text-xs text-muted">{label.subtitle}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
