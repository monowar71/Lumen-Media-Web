export type ConnectionKind = 'lan' | 'external';

interface NetworkInformationLike {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
}

function getConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
  return false;
}

/**
 * Best-effort guess of whether we are on a fast local network or a
 * constrained/external link. Loopback/private API hosts always count as LAN.
 * `navigator.connection` is only available in some browsers (clients.md §6),
 * so this is heuristic and always overridable via bitrate caps in Settings.
 */
export function detectConnectionKind(apiHostname?: string | null): ConnectionKind {
  if (apiHostname && isPrivateOrLoopbackHost(apiHostname)) return 'lan';
  if (typeof window !== 'undefined' && isPrivateOrLoopbackHost(window.location.hostname)) {
    return 'lan';
  }
  const conn = getConnection();
  if (!conn) return 'lan';
  if (conn.saveData) return 'external';
  if (conn.type === 'cellular') return 'external';
  if (conn.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) {
    return 'external';
  }
  if (conn.type === 'wifi' || conn.type === 'ethernet') return 'lan';
  return 'lan';
}
