import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import type { MediaItemSummary } from '@/api/types';
import { PosterImage } from './PosterImage';
import { IconPlay } from './AppIcons';
import { Button } from '@/components/ui/Button';
import { progressFraction } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  playerPath,
  type PlaybackNavState,
} from '@/features/details/playbackNav';

export const CARD_WIDTH = 160;
export const CARD_POSTER_HEIGHT = 240;

export function MediaCard({
  item,
  className,
}: {
  item: MediaItemSummary;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const fraction = progressFraction(item.userData.playbackPositionMs, item.runtimeMs);
  const canResume =
    item.kind === 'Movie'
      ? (item.userData.playbackPositionMs ?? 0) > 0 && !item.userData.watched
      : Boolean(item.userData.nextUp?.userData?.playbackPositionMs);
  const w = CARD_WIDTH;
  const h = CARD_POSTER_HEIGHT;

  const playLabel = canResume ? t('home.resume') : t('home.play');

  const onPlay = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.kind === 'Movie') {
      const resumeMs = canResume ? (item.userData.playbackPositionMs ?? 0) : 0;
      const state: PlaybackNavState = {
        title: item.title,
        resumeMs,
        isEpisode: false,
        backdrop: item.artwork.backdrop,
      };
      navigate(playerPath(item.id), { state });
      return;
    }

    const next = item.userData.nextUp;
    if (next) {
      const state: PlaybackNavState = {
        title:
          next.title?.trim() ||
          `${item.title} — S${next.seasonNumber}E${next.episodeNumber}`,
        resumeMs: next.userData?.playbackPositionMs ?? 0,
        isEpisode: true,
        backdrop: item.artwork.backdrop,
      };
      navigate(playerPath(next.id), { state });
      return;
    }

    navigate(`/item/${item.id}`);
  };

  return (
    <div className={cn('group w-full', className)} style={{ maxWidth: CARD_WIDTH }}>
      <Link
        to={`/item/${item.id}`}
        className="block focus:outline-none"
        aria-label={`${item.title}${item.year ? `, ${item.year}` : ''}`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 shadow-lg shadow-black/30 ring-0 transition duration-200 group-hover:scale-[1.02] group-hover:ring-2 group-hover:ring-accent group-focus-visible:ring-2 group-focus-visible:ring-accent">
          <PosterImage
            path={item.artwork.poster}
            alt={item.title}
            width={w}
            height={h}
            className="h-full"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-on-accent shadow-lg">
              <IconPlay size={22} />
            </span>
          </div>
          {item.userData.watched && (
            <div className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-on-accent">
              {t('badge.watched')}
            </div>
          )}
          {fraction > 0 && !item.userData.watched && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
              <div className="h-full bg-accent" style={{ width: `${fraction * 100}%` }} />
            </div>
          )}
        </div>
        <div className="mt-2 px-0.5">
          <p className="truncate text-sm font-semibold text-text">{item.title}</p>
          <p className="text-xs text-muted">
            {[item.year, item.kind === 'Series' ? t('mediaTypes.Series') : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </Link>
      <Button
        type="button"
        size="sm"
        className="mt-2 w-full"
        onClick={onPlay}
        aria-label={`${playLabel}: ${item.title}`}
      >
        <IconPlay size={14} />
        {playLabel}
      </Button>
    </div>
  );
}
