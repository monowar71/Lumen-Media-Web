import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App';
import { initHttpBridge, restoreSession } from './api/session';

initHttpBridge();

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return;
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();
}

void enableMocking()
  .then(() => restoreSession())
  .then(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) throw new Error('Root element #root not found');
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
