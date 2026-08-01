import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { LibraryScreen } from './LibraryScreen';
import { authenticate, renderWithProviders } from '@/test/utils';
import { useLibraryUiStore } from '@/stores/libraryUiStore';

describe('LibraryScreen', () => {
  it('renders a virtualized poster grid from the mocked API', async () => {
    authenticate();
    renderWithProviders(
      <Routes>
        <Route path="/library/:libraryId" element={<LibraryScreen />} />
      </Routes>,
      { route: '/library/lib-movies' },
    );

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();

    // Library header reflects the total from the paged envelope.
    expect(screen.getByText(/3 (items|шт\.)/i)).toBeInTheDocument();
  });

  it('filters items via the search box', async () => {
    authenticate();
    const { getByLabelText, getByRole } = renderWithProviders(
      <Routes>
        <Route path="/library/:libraryId" element={<LibraryScreen />} />
      </Routes>,
      { route: '/library/lib-movies' },
    );

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());

    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    await user.click(getByRole('button', { name: /filters|фильтры/i }));

    const input = getByLabelText(/filter items|фильтр элементов/i);
    await user.type(input, 'matrix');

    await waitFor(() => expect(screen.queryByText('Inception')).not.toBeInTheDocument());
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
  });

  it('persists sort and order across remounts', async () => {
    authenticate();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    const first = renderWithProviders(
      <Routes>
        <Route path="/library/:libraryId" element={<LibraryScreen />} />
      </Routes>,
      { route: '/library/lib-movies' },
    );

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText(/sort by|сортировка/i), 'year');
    await user.click(screen.getByRole('button', { name: /ascending|по возрастанию/i }));

    expect(useLibraryUiStore.getState().sort).toBe('year');
    expect(useLibraryUiStore.getState().order).toBe('desc');
    expect(localStorage.getItem('lumenmedia.libraryUi')).toContain('"sort":"year"');

    first.unmount();

    renderWithProviders(
      <Routes>
        <Route path="/library/:libraryId" element={<LibraryScreen />} />
      </Routes>,
      { route: '/library/lib-movies' },
    );

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());
    expect(screen.getByLabelText(/sort by|сортировка/i)).toHaveValue('year');
    expect(screen.getByRole('button', { name: /descending|по убыванию/i })).toBeInTheDocument();
  });
});
