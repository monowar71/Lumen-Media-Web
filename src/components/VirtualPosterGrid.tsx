import { useEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { MediaItemSummary } from '@/api/types';
import { MediaCard } from './MediaCard';
import { useElementWidth } from '@/lib/useElementWidth';
import { Spinner } from './ui/Spinner';

interface VirtualPosterGridProps {
  items: MediaItemSummary[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const GAP = 16;
const MIN_CARD = 150;
const LABEL_HEIGHT = 52;

/**
 * Window-virtualized responsive poster grid. Only the rows in view are
 * rendered (client_web/AGENTS.md: virtualize long lists). Infinite scroll is
 * driven by the last visible virtual row approaching the end.
 */
export function VirtualPosterGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualPosterGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(parentRef);
  const [scrollMargin, setScrollMargin] = useState(0);

  const columns = Math.max(1, Math.floor((width + GAP) / (MIN_CARD + GAP)));
  const cardWidth = columns > 0 && width > 0 ? (width - GAP * (columns - 1)) / columns : MIN_CARD;
  const rowHeight = cardWidth * 1.5 + LABEL_HEIGHT + GAP;
  const rowCount = Math.ceil(items.length / columns);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScrollMargin(el.offsetTop);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 4,
    scrollMargin,
  });

  // Re-measure when layout inputs change (resize -> different columns/rowHeight).
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeight, columns]);

  const virtualRows = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualRows[virtualRows.length - 1];
    if (!last) return;
    if (last.index >= rowCount - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualRows, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="w-full">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualRows.map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowItems = items.slice(start, start + columns);
          return (
            <div
              key={virtualRow.key}
              data-testid="poster-grid-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: GAP,
              }}
            >
              {rowItems.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          );
        })}
      </div>
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </div>
  );
}
