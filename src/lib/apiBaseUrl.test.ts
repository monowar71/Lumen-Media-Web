import { describe, expect, it } from 'vitest';
import {
  isLoopbackUrl,
  normalizeBaseUrl,
  resolveDefaultApiBaseUrl,
  rewriteLoopbackBaseUrlForPage,
} from './apiBaseUrl';

describe('apiBaseUrl', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeBaseUrl('http://host:8096/')).toBe('http://host:8096');
  });

  it('prefers env override', () => {
    expect(resolveDefaultApiBaseUrl('http://custom:9000/', '192.168.0.92')).toBe(
      'http://custom:9000',
    );
  });

  it('uses LAN page host when no env', () => {
    expect(resolveDefaultApiBaseUrl(undefined, '192.168.0.92')).toBe(
      'http://192.168.0.92:8096',
    );
  });

  it('falls back to localhost on loopback page host', () => {
    expect(resolveDefaultApiBaseUrl(null, 'localhost')).toBe('http://localhost:8096');
    expect(resolveDefaultApiBaseUrl(null, '127.0.0.1')).toBe('http://localhost:8096');
  });

  it('rewrites persisted localhost when page is on LAN', () => {
    expect(rewriteLoopbackBaseUrlForPage('http://localhost:8096', '192.168.0.92')).toBe(
      'http://192.168.0.92:8096',
    );
  });

  it('keeps non-loopback saved URL', () => {
    expect(rewriteLoopbackBaseUrlForPage('http://nas.local:8096', '192.168.0.92')).toBe(
      'http://nas.local:8096',
    );
  });

  it('detects loopback URLs', () => {
    expect(isLoopbackUrl('http://127.0.0.1:8096')).toBe(true);
    expect(isLoopbackUrl('http://192.168.0.92:8096')).toBe(false);
  });
});
