import { randomId } from './utils';

const KEY = 'lumenmedia.deviceId';

/** Stable, non-sensitive device identifier used for login/session tracking. */
export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'web-ephemeral';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = randomId('web');
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'LumenMedia Web';
  const ua = navigator.userAgent;
  const browser = /Firefox/.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome/.test(ua)
        ? 'Chrome'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Browser';
  return `LumenMedia Web (${browser})`;
}
