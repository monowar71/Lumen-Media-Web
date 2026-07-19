import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionKind } from '@/lib/network';
import {
  normalizeBaseUrl,
  resolveDefaultApiBaseUrl,
  rewriteLoopbackBaseUrlForPage,
} from '@/lib/apiBaseUrl';

function pageHostname(): string | undefined {
  return typeof window !== 'undefined' ? window.location.hostname : undefined;
}

const DEFAULT_BASE_URL = resolveDefaultApiBaseUrl(
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined,
  pageHostname(),
);

export interface SettingsState {
  baseUrl: string;
  /** Bitrate cap (kbps) on a fast local network. 0 means "no cap". */
  lanCapKbps: number;
  /** Bitrate cap (kbps) on external/mobile connections. */
  externalCapKbps: number;
  setBaseUrl: (url: string) => void;
  setLanCap: (kbps: number) => void;
  setExternalCap: (kbps: number) => void;
  capForConnection: (kind: ConnectionKind) => number;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      baseUrl: normalizeBaseUrl(DEFAULT_BASE_URL),
      lanCapKbps: 0,
      externalCapKbps: 8000,
      setBaseUrl: (url) => set({ baseUrl: normalizeBaseUrl(url) }),
      setLanCap: (kbps) => set({ lanCapKbps: Math.max(0, kbps) }),
      setExternalCap: (kbps) => set({ externalCapKbps: Math.max(0, kbps) }),
      capForConnection: (kind) => {
        const { lanCapKbps, externalCapKbps } = get();
        // 0 (no cap) maps to a large value so the server treats it as "unlimited".
        if (kind === 'external') return externalCapKbps > 0 ? externalCapKbps : 100_000;
        return lanCapKbps > 0 ? lanCapKbps : 100_000;
      },
    }),
    {
      name: 'freeplex.settings',
      partialize: (s) => ({
        baseUrl: s.baseUrl,
        lanCapKbps: s.lanCapKbps,
        externalCapKbps: s.externalCapKbps,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        const raw = typeof p.baseUrl === 'string' ? p.baseUrl : current.baseUrl;
        return {
          ...current,
          ...p,
          baseUrl: rewriteLoopbackBaseUrlForPage(raw, pageHostname()),
        };
      },
    },
  ),
);
