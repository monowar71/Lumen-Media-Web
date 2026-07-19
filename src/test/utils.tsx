import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { mockUser } from '@/mocks/data';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function authenticate(): void {
  useAuthStore.getState().setSession({
    user: mockUser,
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
  });
}

interface WrapperOptions {
  route?: string;
  client?: QueryClient;
}

export function TestProviders({
  children,
  route = '/',
  client,
}: {
  children: ReactNode;
  route?: string;
  client?: QueryClient;
}) {
  const qc = client ?? createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: WrapperOptions = {}) {
  const client = options.client ?? createTestQueryClient();
  return render(
    <TestProviders route={options.route} client={client}>
      {ui}
    </TestProviders>,
  );
}

export function createQueryWrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}
