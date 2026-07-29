import { useTranslation } from 'react-i18next';
import type { MediaSource } from '@/api/types';
import { mediaSourceLabel } from '@/lib/mediaSourceLabel';

type Props = {
  sources: MediaSource[];
};

/** Compact cards listing each media file's source video/audio formats. */
export function MediaSourcesInfo({ sources }: Props) {
  const { t } = useTranslation('details');
  if (sources.length === 0) return null;

  return (
    <section className="mt-5 max-w-3xl" aria-label={t('mediaFiles')}>
      <h2 className="mb-2 text-sm font-semibold text-muted">{t('mediaFiles')}</h2>
      <ul className="flex flex-col gap-2">
        {sources.map((source, index) => {
          const label = mediaSourceLabel(source, index);
          return (
            <li
              key={source.id}
              className="rounded-xl border border-border/80 bg-surface-2/30 px-3.5 py-2.5"
            >
              <p className="truncate text-sm font-medium text-text">{label.title}</p>
              {(label.video || label.audio) && (
                <dl className="mt-1.5 grid gap-0.5 text-xs text-muted sm:text-sm">
                  {label.video && (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="shrink-0 font-medium text-text/70">{t('mediaVideo')}:</dt>
                      <dd>{label.video}</dd>
                    </div>
                  )}
                  {label.audio && (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="shrink-0 font-medium text-text/70">{t('mediaAudio')}:</dt>
                      <dd>
                        {label.audio}
                        {label.extraAudioTracks > 0 && (
                          <span className="text-muted">
                            {' '}
                            {t('mediaExtraAudio', { count: label.extraAudioTracks })}
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {label.subtitle && (
                <p className="mt-1 truncate text-xs text-muted">{label.subtitle}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
