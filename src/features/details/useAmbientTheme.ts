import { useEffect, useRef } from 'react';
import { absoluteUrl } from '@/lib/artwork';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Soft-loop ambient theme on movie/series detail when the server cached a ThemerrDB track.
 * Pauses on leave / when themeUrl clears; ignores autoplay blocks quietly.
 */
export function useAmbientTheme(themeUrl: string | null | undefined) {
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!themeUrl || !baseUrl) return;

    const url = new URL(absoluteUrl(baseUrl, themeUrl));
    if (token) url.searchParams.set('access_token', token);

    const audio = new Audio(url.toString());
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'auto';
    audioRef.current = audio;

    const play = () => {
      void audio.play().catch(() => {
        // Autoplay may be blocked until a user gesture; ignore.
      });
    };

    // Resume after the first pointer/keydown if the browser blocked autoplay.
    const unlock = () => {
      play();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    play();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [themeUrl, baseUrl, token]);
}
