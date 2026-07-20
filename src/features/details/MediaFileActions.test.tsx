import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { fileNameFromPath } from '@/lib/mediaFile';
import { authenticate, renderWithProviders } from '@/test/utils';
import { mockMovieDetail } from '@/mocks/data';
import { MediaFileActions } from './MediaFileActions';

describe('fileNameFromPath', () => {
  it('returns the basename of a media path', () => {
    expect(fileNameFromPath('/hdd/Lucky.S01E01.mkv', 'fallback.mkv')).toBe('Lucky.S01E01.mkv');
    expect(fileNameFromPath(undefined, 'fallback.mkv')).toBe('fallback.mkv');
  });
});

describe('MediaFileActions', () => {
  it('shows download for any user and delete for admin inside the menu', async () => {
    // Restore disposable mock if a prior test deleted it.
    if (!mockMovieDetail['movie-mock-delete']) {
      mockMovieDetail['movie-mock-delete'] = {
        id: 'movie-mock-delete',
        kind: 'Movie',
        title: 'Mock Delete Me',
        year: 2024,
        overview: 'Synthetic fixture for download/delete tests. Safe to remove.',
        runtimeMs: 60000,
        genres: [],
        studios: [],
        people: [],
        artwork: {},
        mediaSources: [
          {
            id: 'src-mock-delete-01',
            path: '/media/mock/delete-me.mkv',
            container: 'mkv',
            sizeBytes: 1024,
            durationMs: 60000,
            overallBitrateKbps: 1000,
            streams: [],
          },
        ],
        userData: { watched: false, playbackPositionMs: 0, isFavorite: false },
        libraryId: 'lib-movies',
        addedAt: '2026-07-01T00:00:00Z',
        externalIds: {},
      };
    }

    authenticate({ role: 'Admin' });
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    renderWithProviders(
      <MediaFileActions mediaId="movie-mock-delete" fileName="mock.mkv" />,
    );

    await user.click(screen.getByRole('button', { name: /more actions|ещё действия/i }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText(/download|скачать/i)).toBeInTheDocument();
    expect(within(menu).getByText(/delete file|удалить файл/i)).toBeInTheDocument();
  });

  it('hides delete for non-admin', async () => {
    authenticate({ role: 'User' });
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    renderWithProviders(<MediaFileActions mediaId="movie-mock-delete" />);

    await user.click(screen.getByRole('button', { name: /more actions|ещё действия/i }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText(/download|скачать/i)).toBeInTheDocument();
    expect(within(menu).queryByText(/delete file|удалить файл/i)).toBeNull();
  });

  it('deletes only the mock fixture after confirm', async () => {
    authenticate({ role: 'Admin' });
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(
      <Routes>
        <Route
          path="/item/:id"
          element={<MediaFileActions mediaId="movie-mock-delete" onRemovedNavigateTo="/" />}
        />
        <Route path="/" element={<div>home</div>} />
      </Routes>,
      { route: '/item/movie-mock-delete' },
    );

    await user.click(screen.getByRole('button', { name: /more actions|ещё действия/i }));
    await user.click(await screen.findByText(/delete file|удалить файл/i));

    await waitFor(() => expect(mockMovieDetail['movie-mock-delete']).toBeUndefined());
  });
});
