import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { startRealtime, stopRealtime } from '@/api/realtime';

/** Keeps the SignalR hub connected while the user is authenticated. */
export function useRealtime() {
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const qc = useQueryClient();

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
      void stopRealtime();
      return;
    }
    void startRealtime(baseUrl, accessToken, qc);
    return () => {
      void stopRealtime();
    };
  }, [status, accessToken, baseUrl, qc]);
}
