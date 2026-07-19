import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ProblemDetails, RefreshResponse } from './types';

/**
 * Bridge between the axios instance and the session store. The store registers
 * accessors here so the HTTP layer stays free of a hard dependency on Zustand
 * (avoids a circular import and keeps server/client state separated).
 */
export interface AuthBridge {
  getBaseUrl: () => string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken: string, expiresInSec: number) => void;
  onAuthExpired: () => void;
}

let bridge: AuthBridge | null = null;

export function configureHttp(next: AuthBridge): void {
  bridge = next;
}

function requireBridge(): AuthBridge {
  if (!bridge) throw new Error('HTTP layer used before configureHttp() was called');
  return bridge;
}

export const http: AxiosInstance = axios.create({
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const b = requireBridge();
  config.baseURL = b.getBaseUrl();
  const token = b.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Single-flight refresh handling ---
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const b = requireBridge();
  const refreshToken = b.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  // Use a bare axios call so this request bypasses the interceptors below.
  const { data } = await axios.post<RefreshResponse>(
    `${b.getBaseUrl()}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
  );
  b.onTokensRefreshed(data.accessToken, data.refreshToken, data.expiresInSec);
  return data.accessToken;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ProblemDetails>) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const b = requireBridge();

    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      } catch (refreshError) {
        b.onAuthExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

/** Normalizes an axios error into a human-readable message from Problem Details. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    const data = error.response?.data;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
    return data?.detail ?? data?.title ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
