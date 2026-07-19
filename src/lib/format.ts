import i18n from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

export function formatRuntime(ms?: number | null): string {
  if (!ms || ms <= 0) return '';
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return i18n.t('format.runtimeHoursMinutes', { hours, minutes });
  }
  return i18n.t('format.runtimeMinutes', { minutes });
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function progressFraction(positionMs?: number, durationMs?: number | null): number {
  if (!positionMs || !durationMs || durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, positionMs / durationMs));
}

/** Localized label for ISO-639 / ffprobe language codes. */
export function formatTrackLanguage(code?: string | null): string {
  if (!code) return i18n.t('trackLanguage.unknown');
  const key = `trackLanguage.${code.toLowerCase()}`;
  if (i18n.exists(key)) return i18n.t(key);
  return code.toUpperCase();
}

export function intlLocale(): string {
  const locale = useSettingsStore.getState().locale;
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}
