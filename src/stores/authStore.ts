import { create } from 'zustand';
import type { UserDto } from '@/api/types';

/** Survives page reload within the tab; cleared on tab close / logout. */
const REFRESH_STORAGE_KEY = 'freeplex.refreshToken';

export type AuthStatus = 'restoring' | 'anonymous' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  /** Access token stays in memory only (short-lived). */
  accessToken: string | null;
  /** Refresh token is mirrored to sessionStorage so F5 keeps you signed in. */
  refreshToken: string | null;
  setSession: (session: {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
  }) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserDto) => void;
  /** Marks boot-time session restore in progress (prevents a flash of /login). */
  beginRestore: (refreshToken: string) => void;
  clear: () => void;
}

function readStoredRefresh(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefresh(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(REFRESH_STORAGE_KEY, token);
    else sessionStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    /* private mode / blocked storage — session will not survive reload */
  }
}

const storedRefresh = typeof sessionStorage !== 'undefined' ? readStoredRefresh() : null;

export const useAuthStore = create<AuthState>((set) => ({
  // If a refresh token survived the reload, start in "restoring" so RequireAuth
  // waits instead of bouncing to /login before restoreSession() finishes.
  status: storedRefresh ? 'restoring' : 'anonymous',
  user: null,
  accessToken: null,
  refreshToken: storedRefresh,
  setSession: ({ user, accessToken, refreshToken }) => {
    writeStoredRefresh(refreshToken);
    set({ status: 'authenticated', user, accessToken, refreshToken });
  },
  updateTokens: (accessToken, refreshToken) => {
    writeStoredRefresh(refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => set({ user }),
  beginRestore: (refreshToken) => {
    writeStoredRefresh(refreshToken);
    set({ status: 'restoring', refreshToken, accessToken: null, user: null });
  },
  clear: () => {
    writeStoredRefresh(null);
    set({ status: 'anonymous', user: null, accessToken: null, refreshToken: null });
  },
}));
