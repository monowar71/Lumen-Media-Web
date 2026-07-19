import type { MediaItemSummary } from '@/api/types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItemSummary[];
}

export function MediaRow({ title, items }: MediaRowProps) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-display mb-3 text-lg font-bold text-text sm:text-xl">{title}</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0">
        {items.map((item) => (
          <div key={item.id} className="w-[132px] shrink-0 sm:w-[160px]">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
