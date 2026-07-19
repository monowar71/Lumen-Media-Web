import { Link } from 'react-router-dom';
import type { MediaItemSummary } from '@/api/types';
import { PosterImage } from './PosterImage';
import { progressFraction } from '@/lib/format';

export const CARD_WIDTH = 180;
export const CARD_POSTER_HEIGHT = 270;

export function MediaCard({ item }: { item: MediaItemSummary }) {
  const fraction = progressFraction(item.userData.playbackPositionMs, item.runtimeMs);

  return (
    <Link
      to={`/item/${item.id}`}
      className="group block focus:outline-none"
      aria-label={`${item.title}${item.year ? `, ${item.year}` : ''}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg ring-0 ring-accent transition group-hover:ring-2 group-focus-visible:ring-2">
        <PosterImage
          path={item.artwork.poster}
          alt={item.title}
          width={CARD_WIDTH}
          height={CARD_POSTER_HEIGHT}
          className="h-full"
        />
        {item.userData.watched && (
          <div className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
            Watched
          </div>
        )}
        {fraction > 0 && !item.userData.watched && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${fraction * 100}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium text-text">{item.title}</p>
        <p className="text-xs text-muted">
          {item.year ?? ''}
          {item.kind === 'Series' ? ' · Series' : ''}
        </p>
      </div>
    </Link>
  );
}
