import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MediaFileActions } from './MediaFileActions';
import { authenticate, renderWithProviders } from '@/test/utils';
import { mockMovieDetail } from '@/mocks/data';

const movie = mockMovieDetail['movie-matrix']!;

describe('MetadataAdminPanel cover picker', () => {
  async function openEdit() {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    renderWithProviders(
      <MediaFileActions
        mediaId={movie.id}
        showDownload={false}
        metadataAdmin={{
          id: movie.id,
          kind: 'Movie',
          title: movie.title,
          year: movie.year,
          overview: movie.overview,
          metadataLocked: false,
          externalIds: movie.externalIds,
          artwork: movie.artwork,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ещё действия' }));
    await user.click(screen.getByRole('menuitem', { name: 'Редактировать' }));
    return user;
  }

  it('lists alternative posters in the edit dialog for a TMDB-matched item', async () => {
    authenticate({ role: 'Admin' });
    await openEdit();
    expect(screen.getByRole('heading', { name: 'Обложка' })).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getAllByRole('button', { name: /Выбрать обложку/i }).length).toBeGreaterThan(0);
      },
      { timeout: 8000 },
    );
  });

  it('applies a selected poster', async () => {
    authenticate({ role: 'Admin' });
    const user = await openEdit();
    const options = await screen.findAllByRole(
      'button',
      { name: /Выбрать обложку/i },
      { timeout: 8000 },
    );
    await user.click(options[0]!);
    expect(await screen.findByText('Обложка обновлена.', {}, { timeout: 8000 })).toBeInTheDocument();
  });
});
