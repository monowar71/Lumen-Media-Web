import { useTranslation } from 'react-i18next';
import { useMarkWatchedMutation } from '@/api/queries';
import { Button } from '@/components/ui/Button';

type Props = {
  itemId: string;
  watched: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/** Toggle mark-as-watched / mark-as-unwatched for movie, episode, season, or series. */
export function WatchedToggle({ itemId, watched, size = 'lg', className }: Props) {
  const { t } = useTranslation('details');
  const mark = useMarkWatchedMutation();

  return (
    <Button
      size={size}
      variant="secondary"
      className={className}
      disabled={mark.isPending}
      aria-pressed={watched}
      onClick={() => mark.mutate({ itemId, watched: !watched })}
    >
      {watched ? t('markUnwatched') : t('markWatched')}
    </Button>
  );
}
