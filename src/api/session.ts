import { configureHttp } from './http';
import * as api from './endpoints';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Connects the HTTP layer to the session + settings stores. Called once at app
 * startup (and in test setup). Keeps the axios interceptors decoupled from
 * Zustand to preserve the server/client-state separation.
 */
export function initHttpBridge(): void {
  configureHttp({
    getBaseUrl: () => useSettingsStore.getState().baseUrl,
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onTokensRefreshed: (accessToken, refreshToken) => {
      useAuthStore.getState().updateTokens(accessToken, refreshToken);
    },
    onAuthExpired: () => {
      useAuthStore.getState().clear();
    },
  });
}

/**
 * After a full page reload the access token is gone (memory-only), but the
 * refresh token may still be in sessionStorage. Exchange it for a new pair and
 * reload /auth/me so the user stays signed in.
 */
export async function restoreSession(): Promise<void> {
  const { status, refreshToken, setSession, clear } = useAuthStore.getState();
  if (status !== 'restoring' || !refreshToken) {
    if (status === 'restoring') clear();
    return;
  }

  const baseUrl = useSettingsStore.getState().baseUrl;
  try {
    // Bare axios via the public refresh helper path in endpoints would still go
    // through interceptors; call the API module which posts to /auth/refresh
    // without requiring an access token.
    const tokens = await api.refresh(refreshToken, baseUrl);
    useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken);
    const user = await api.getMe();
    setSession({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch {
    clear();
  }
}
