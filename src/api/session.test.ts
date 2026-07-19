import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { restoreSession } from '@/api/session';

describe('session restore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.getState().clear();
  });

  it('restores authenticated session from stored refresh token', async () => {
    sessionStorage.setItem('freeplex.refreshToken', 'mock-refresh-token');
    useAuthStore.getState().beginRestore('mock-refresh-token');

    await restoreSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBeTruthy();
    expect(state.user?.username).toBe('alex');
  });

  it('clears session when refresh token is invalid', async () => {
    sessionStorage.setItem('freeplex.refreshToken', 'bad-token');
    useAuthStore.getState().beginRestore('bad-token');

    await restoreSession();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(sessionStorage.getItem('freeplex.refreshToken')).toBeNull();
  });
});
