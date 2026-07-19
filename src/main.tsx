import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app/App';
import { initHttpBridge, restoreSession } from './api/session';
import { useSettingsStore } from './stores/settingsStore';
import i18n from './i18n';

initHttpBridge();

// Sync i18n with persisted locale before first paint.
void i18n.changeLanguage(useSettingsStore.getState().locale);

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
