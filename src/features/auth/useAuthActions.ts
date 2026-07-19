import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { getDeviceId, getDeviceName } from '@/lib/device';

export function useAuthActions() {
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await api.login({
        username,
        password,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
      });
      setSession({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      return res.user;
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Best-effort: revoke server-side, but always clear locally.
    }
    clear();
    qc.clear();
  }, [clear, qc]);

  return { login, logout };
}
