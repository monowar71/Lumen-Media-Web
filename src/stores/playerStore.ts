import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaybackMode } from '@/api/types';

/** Client-side player UI preferences (not server state). */
export interface PlayerState {
  volume: number;
  muted: boolean;
  preferredMode: PlaybackMode;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setPreferredMode: (m: PlaybackMode) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      volume: 1,
      muted: false,
      preferredMode: 'auto',
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setMuted: (m) => set({ muted: m }),
      setPreferredMode: (m) => set({ preferredMode: m }),
    }),
    { name: 'freeplex.player' },
  ),
);
