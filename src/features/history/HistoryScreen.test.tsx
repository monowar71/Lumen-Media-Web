import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { HistoryScreen } from './HistoryScreen';
import { authenticate, renderWithProviders } from '@/test/utils';
import { resetMockHistory } from '@/mocks/data';

describe('HistoryScreen', () => {
  beforeEach(() => {
    resetMockHistory();
  });

  it('lists watch history from the API', async () => {
    authenticate();
    renderWithProviders(
      <Routes>
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>,
      { route: '/history' },
    );

    await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument());
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Pilot')).toBeInTheDocument();
  });

  it('clears history after confirmation', async () => {
    authenticate();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>,
      { route: '/history' },
    );

    await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /clear|очистить/i }));

    await waitFor(() =>
      expect(screen.getByText(/no history yet|история пуста/i)).toBeInTheDocument(),
    );
  });

  it('imports history from plex form', async () => {
    authenticate();
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>,
      { route: '/history' },
    );

    await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /import from plex|импорт из plex/i }));

    await user.type(screen.getByPlaceholderText('http://192.168.0.10:32400'), 'http://plex:32400');
    // Token field has no placeholder — find by label text via the nearest input type=password
    const token = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(token).toBeTruthy();
    await user.type(token, 'plex-token');
    await user.click(screen.getByRole('button', { name: /^import$|^импортировать$/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/scanned|просмотрено в plex/i),
    );
  });
});
