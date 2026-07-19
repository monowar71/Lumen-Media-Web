import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { MediaFileActions } from './MediaFileActions';
import { authenticate, renderWithProviders } from '@/test/utils';
import { mockMovieDetail } from '@/mocks/data';

describe('MediaFileActions', () => {
  beforeEach(() => {
    // Restore disposable mock if a prior test deleted it.
    if (!mockMovieDetail['movie-mock-delete']) {
      mockMovieDetail['movie-mock-delete'] = {
        id: 'movie-mock-delete',
        kind: 'Movie',
        title: 'Mock Delete Me',
        year: 2026,
        overview: 'Synthetic fixture',
        runtimeMs: 60000,
        artwork: {},
        mediaSources: [
          {
            id: 'src-mock-delete-01',
            container: 'mkv',
            sizeBytes: 1024,
            durationMs: 60000,
            overallBitrateKbps: 100,
            streams: [],
          },
        ],
        userData: { watched: false, playbackPositionMs: 0 },
        libraryId: 'lib-movies',
        addedAt: '2026-07-19T00:00:00Z',
      };
    }
  });

  it('shows download for any user and delete for admin', async () => {
    authenticate({ role: 'Admin' });
    renderWithProviders(
      <MediaFileActions mediaId="movie-mock-delete" fileName="mock.mkv" />,
    );

    expect(screen.getByRole('button', { name: /download|скачать/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete file|удалить файл/i })).toBeInTheDocument();
  });

  it('hides delete for non-admin', () => {
    authenticate({ role: 'User' });
    renderWithProviders(<MediaFileActions mediaId="movie-mock-delete" />);

    expect(screen.getByRole('button', { name: /download|скачать/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete file|удалить файл/i })).toBeNull();
  });

  it('deletes only the mock fixture after confirm', async () => {
    authenticate({ role: 'Admin' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route
          path="/item/:id"
          element={<MediaFileActions mediaId="movie-mock-delete" onRemovedNavigateTo="/" />}
        />
      </Routes>,
      { route: '/item/movie-mock-delete' },
    );

    await user.click(screen.getByRole('button', { name: /delete file|удалить файл/i }));
    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument());
    expect(mockMovieDetail['movie-mock-delete']).toBeUndefined();
  });
});
