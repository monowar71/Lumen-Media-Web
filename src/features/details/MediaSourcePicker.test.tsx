import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import type { MediaSource } from '@/api/types';
import { formatBytes } from '@/lib/format';
import { mediaSourceLabel, resolutionLabel } from '@/lib/mediaSourceLabel';
import { authenticate, renderWithProviders } from '@/test/utils';
import { mockEpisodeDetail, mockMovieDetail } from '@/mocks/data';
import { MovieDetailView } from './MovieDetailView';
import { MediaSourcePicker } from './MediaSourcePicker';
import i18n from '@/i18n';

const dualSources: MediaSource[] = [
  {
    id: 'src-a',
    path: '/media/A.2160p.mkv',
    container: 'mkv',
    sizeBytes: 10 * 1024 * 1024 * 1024,
    durationMs: 60000,
    overallBitrateKbps: 40000,
    streams: [{ id: 'v1', kind: 'Video', index: 0, codec: 'hevc', width: 3840, height: 2160, hdr: 'HDR10' }],
  },
  {
    id: 'src-b',
    path: '/media/B.1080p.mp4',
    container: 'mp4',
    sizeBytes: 2 * 1024 * 1024 * 1024,
    durationMs: 60000,
    overallBitrateKbps: 8000,
    streams: [{ id: 'v2', kind: 'Video', index: 0, codec: 'h264', width: 1920, height: 1080 }],
  },
];

function LocationProbe() {
  const loc = useLocation();
  return (
    <pre data-testid="loc">
      {JSON.stringify({ pathname: loc.pathname, state: loc.state })}
    </pre>
  );
}

describe('formatBytes / mediaSourceLabel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toContain('512');
    expect(formatBytes(1536)).toMatch(/KB/);
    expect(formatBytes(5 * 1024 * 1024)).toMatch(/MB/);
  });

  it('builds labels from path and streams', () => {
    expect(resolutionLabel(3840, 2160)).toBe('2160p');
    const label = mediaSourceLabel(dualSources[0], 0);
    expect(label.title).toBe('A.2160p.mkv');
    expect(label.video).toMatch(/2160p/);
    expect(label.video).toMatch(/HEVC/);
    expect(label.video).toMatch(/HDR10/);
    expect(label.subtitle).toMatch(/MKV/);
  });
});

describe('MediaSourcePicker', () => {
  it('calls onSelect with the chosen source id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <MediaSourcePicker sources={dualSources} onSelect={onSelect} onClose={vi.fn()} />,
    );

    await user.click(screen.getByText('B.1080p.mp4'));
    expect(onSelect).toHaveBeenCalledWith('src-b');
  });
});

describe('MovieDetailView multi-source play', () => {
  beforeEach(() => {
    authenticate();
  });

  it('opens a version picker and navigates with the selected mediaSourceId', async () => {
    const user = userEvent.setup();
    const movie = mockMovieDetail['movie-matrix'];
    expect(movie.mediaSources.length).toBeGreaterThan(1);

    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <MovieDetailView movie={movie} />
              <LocationProbe />
            </>
          }
        />
        <Route path="/watch/:itemId" element={<LocationProbe />} />
      </Routes>,
    );

    await user.click(screen.getByRole('button', { name: /продолжить|смотреть|play|resume/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/The\.Matrix\.1999\.2160p\.mkv/i);

    await user.click(within(dialog).getByText(/The\.Matrix\.1999\.1080p\.mp4/i));

    await waitFor(() => {
      const payload = JSON.parse(screen.getByTestId('loc').textContent ?? '{}') as {
        pathname: string;
        state: { mediaSourceId?: string };
      };
      expect(payload.pathname).toBe('/watch/movie-matrix');
      expect(payload.state.mediaSourceId).toBe('src-matrix-02');
    });
  });
});

describe('episode multi-source fixture', () => {
  it('mock ep-bb-101 has two media sources for picker flows', () => {
    expect(mockEpisodeDetail['ep-bb-101'].mediaSources).toHaveLength(2);
  });
});
