import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@/mocks/server';
import { initHttpBridge } from '@/api/session';
import { useAuthStore } from '@/stores/authStore';

initHttpBridge();

// --- jsdom polyfills ---
class ResizeObserverMock {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(): void {
    this.cb(
      [{ contentRect: { width: 1024, height: 768 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

class IntersectionObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// HTMLMediaElement methods are not implemented in jsdom.
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

// --- MSW lifecycle ---
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  useAuthStore.getState().clear();
  sessionStorage.clear();
});
afterAll(() => server.close());

beforeEach(() => {
  useAuthStore.getState().clear();
  sessionStorage.clear();
});
