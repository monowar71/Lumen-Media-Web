import { useTranslation } from 'react-i18next';
import { useMarkWatchedMutation } from '@/api/queries';
import { Button } from '@/components/ui/Button';

type Props = {
  itemId: string;
  watched: boolean;
  playbackPositionMs?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/** Toggle mark-as-watched / mark-as-unwatched for movie, episode, season, or series. */
export function WatchedToggle({
  itemId,
  watched,
  playbackPositionMs = 0,
  size = 'lg',
  className,
}: Props) {
  const { t } = useTranslation('details');
  const mark = useMarkWatchedMutation();
  const showMarkWatched = !watched;
  const showMarkUnwatched = watched || playbackPositionMs > 0;

  if (showMarkWatched && showMarkUnwatched) {
    return (
      <div className={className ? `flex flex-wrap gap-2 ${className}` : 'flex flex-wrap gap-2'}>
        <Button
          size={size}
          variant="secondary"
          disabled={mark.isPending}
          onClick={() => mark.mutate({ itemId, watched: true })}
        >
          {t('markWatched')}
        </Button>
        <Button
          size={size}
          variant="secondary"
          disabled={mark.isPending}
          onClick={() => mark.mutate({ itemId, watched: false })}
        >
          {t('markUnwatched')}
        </Button>
      </div>
    );
  }

  const nextWatched = showMarkWatched;
  return (
    <Button
      size={size}
      variant="secondary"
      className={className}
      disabled={mark.isPending}
      aria-pressed={watched}
      onClick={() => mark.mutate({ itemId, watched: nextWatched })}
    >
      {showMarkWatched ? t('markWatched') : t('markUnwatched')}
    </Button>
  );
}
