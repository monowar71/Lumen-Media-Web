import type { MediaItemSummary } from '@/api/types';
import { MediaCard, CARD_WIDTH } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItemSummary[];
}

export function MediaRow({ title, items }: MediaRowProps) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-text">{title}</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item.id} style={{ width: CARD_WIDTH, flex: '0 0 auto' }}>
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
