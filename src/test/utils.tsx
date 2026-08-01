import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { mockUser } from '@/mocks/data';
import i18n from '@/i18n';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function authenticate(overrides?: { role?: 'Admin' | 'User' }): void {
  useAuthStore.getState().setSession({
    user: { ...mockUser, role: overrides?.role ?? mockUser.role },
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
  });
}

interface WrapperOptions {
  route?: string;
  client?: QueryClient;
  locale?: string;
}

export function TestProviders({
  children,
  route = '/',
  client,
  locale = 'ru',
}: {
  children: ReactNode;
  route?: string;
  client?: QueryClient;
  locale?: string;
}) {
  const qc = client ?? createTestQueryClient();
  void i18n.changeLanguage(locale);
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: WrapperOptions = {}) {
  const client = options.client ?? createTestQueryClient();
  return render(
    <TestProviders route={options.route} client={client} locale={options.locale}>
      {ui}
    </TestProviders>,
  );
}

export function createQueryWrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </I18nextProvider>
    );
  };
}
