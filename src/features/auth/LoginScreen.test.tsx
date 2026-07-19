import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { LoginScreen } from './LoginScreen';
import { renderWithProviders } from '@/test/utils';
import { useAuthStore } from '@/stores/authStore';

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<div>Home Page</div>} />
    </Routes>,
    { route: '/login' },
  );
}

describe('LoginScreen', () => {
  it('logs in, stores the session and redirects home', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/имя пользователя|username/i), 'alex');
    await user.type(screen.getByLabelText(/пароль|password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /войти|sign in/i }));

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBeTruthy();
    expect(state.user?.username).toBe('alex');
  });
});
