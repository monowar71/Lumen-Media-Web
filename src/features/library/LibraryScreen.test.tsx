import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { LibraryScreen } from './LibraryScreen';
import { authenticate, renderWithProviders } from '@/test/utils';

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
    const { getByLabelText } = renderWithProviders(
      <Routes>
        <Route path="/library/:libraryId" element={<LibraryScreen />} />
      </Routes>,
      { route: '/library/lib-movies' },
    );

    await waitFor(() => expect(screen.getByText('The Matrix')).toBeInTheDocument());

    const input = getByLabelText(/filter items|фильтр элементов/i);
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    await user.type(input, 'matrix');

    await waitFor(() => expect(screen.queryByText('Inception')).not.toBeInTheDocument());
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
  });
});
