import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LibraryItemsQuery } from '@/api/endpoints';

export type LibrarySortKey = NonNullable<LibraryItemsQuery['sort']>;
export type LibraryOrderKey = NonNullable<LibraryItemsQuery['order']>;

const SORT_KEYS = new Set<LibrarySortKey>(['title', 'year', 'added', 'rating', 'runtime']);
const ORDER_KEYS = new Set<LibraryOrderKey>(['asc', 'desc']);

function isSortKey(v: unknown): v is LibrarySortKey {
  return typeof v === 'string' && SORT_KEYS.has(v as LibrarySortKey);
}

function isOrderKey(v: unknown): v is LibraryOrderKey {
  return typeof v === 'string' && ORDER_KEYS.has(v as LibraryOrderKey);
}

export interface LibraryUiState {
  sort: LibrarySortKey;
  order: LibraryOrderKey;
  setSort: (sort: LibrarySortKey) => void;
  setOrder: (order: LibraryOrderKey) => void;
  toggleOrder: () => void;
}

export const useLibraryUiStore = create<LibraryUiState>()(
  persist(
    (set, get) => ({
      sort: 'title',
      order: 'asc',
      setSort: (sort) => set({ sort }),
      setOrder: (order) => set({ order }),
      toggleOrder: () => set({ order: get().order === 'asc' ? 'desc' : 'asc' }),
    }),
    {
      name: 'lumenmedia.libraryUi',
      partialize: (s) => ({ sort: s.sort, order: s.order }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LibraryUiState>;
        return {
          ...current,
          sort: isSortKey(p.sort) ? p.sort : current.sort,
          order: isOrderKey(p.order) ? p.order : current.order,
        };
      },
    },
  ),
);
