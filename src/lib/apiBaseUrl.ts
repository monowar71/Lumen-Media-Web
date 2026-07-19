/** Default API port when the page is opened on the LAN and no env override is set. */
export const DEFAULT_API_PORT = 8096;

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

export function isLoopbackUrl(url: string): boolean {
  try {
    return isLoopbackHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Prefer `VITE_API_BASE_URL`, otherwise derive from the page host so phones/TVs on the
 * LAN hit the machine running LumenMedia instead of their own localhost.
 */
export function resolveDefaultApiBaseUrl(
  envUrl?: string | null,
  pageHostname?: string | null,
  apiPort: number = DEFAULT_API_PORT,
): string {
  const fromEnv = envUrl?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  const host = pageHostname?.trim();
  if (host && !isLoopbackHostname(host)) {
    return `http://${host}:${apiPort}`;
  }

  return `http://localhost:${apiPort}`;
}

/**
 * If the UI was opened via a LAN IP/hostname but settings still point at localhost
 * (typical after first use on the same machine), rewrite to the page host.
 */
export function rewriteLoopbackBaseUrlForPage(
  savedUrl: string,
  pageHostname?: string | null,
  apiPort: number = DEFAULT_API_PORT,
): string {
  const host = pageHostname?.trim();
  if (!host || isLoopbackHostname(host)) return normalizeBaseUrl(savedUrl);
  if (!isLoopbackUrl(savedUrl)) return normalizeBaseUrl(savedUrl);
  return `http://${host}:${apiPort}`;
}
