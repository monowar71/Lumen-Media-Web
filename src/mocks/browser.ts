import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** Starts MSW in the browser when VITE_ENABLE_MOCKS=true. */
export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
  });
}
