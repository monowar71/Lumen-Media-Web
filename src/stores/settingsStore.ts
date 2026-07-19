import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionKind } from '@/lib/network';
import {
  normalizeBaseUrl,
  resolveDefaultApiBaseUrl,
  rewriteLoopbackBaseUrlForPage,
} from '@/lib/apiBaseUrl';
import i18n, { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '@/i18n';

function pageHostname(): string | undefined {
  return typeof window !== 'undefined' ? window.location.hostname : undefined;
}

const DEFAULT_BASE_URL = resolveDefaultApiBaseUrl(
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined,
  pageHostname(),
);

export interface SettingsState {
  baseUrl: string;
  /** UI locale (`ru` default, `en` fallback catalog). */
  locale: AppLocale;
  /** Bitrate cap (kbps) on a fast local network. 0 means "no cap". */
  lanCapKbps: number;
  /** Bitrate cap (kbps) on external/mobile connections. */
  externalCapKbps: number;
  setBaseUrl: (url: string) => void;
  setLocale: (locale: AppLocale) => void;
  setLanCap: (kbps: number) => void;
  setExternalCap: (kbps: number) => void;
  capForConnection: (kind: ConnectionKind) => number;
}

function applyLocale(locale: AppLocale): void {
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      baseUrl: normalizeBaseUrl(DEFAULT_BASE_URL),
      locale: DEFAULT_LOCALE,
      lanCapKbps: 0,
      externalCapKbps: 8000,
      setBaseUrl: (url) => set({ baseUrl: normalizeBaseUrl(url) }),
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
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
      name: 'lumenmedia.settings',
      partialize: (s) => ({
        baseUrl: s.baseUrl,
        locale: s.locale,
        lanCapKbps: s.lanCapKbps,
        externalCapKbps: s.externalCapKbps,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        const raw = typeof p.baseUrl === 'string' ? p.baseUrl : current.baseUrl;
        const locale = typeof p.locale === 'string' && isAppLocale(p.locale) ? p.locale : current.locale;
        applyLocale(locale);
        return {
          ...current,
          ...p,
          locale,
          baseUrl: rewriteLoopbackBaseUrlForPage(raw, pageHostname()),
        };
      },
    },
  ),
);
