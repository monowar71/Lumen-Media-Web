import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Slider from '@radix-ui/react-slider';
import { usePlayback } from './usePlayback';
import { TrackMenu, type TrackOption } from './TrackMenu';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatTime } from '@/lib/format';
import { absoluteUrl } from '@/lib/artwork';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { PlaybackNavState } from '@/features/details/playbackNav';

function subtitleTrackUrl(baseUrl: string, url: string, token: string | null): string {
  const abs = absoluteUrl(baseUrl, url);
  if (!token) return abs;
  const u = new URL(abs);
  u.searchParams.set('access_token', token);
  return u.toString();
}

export function PlayerScreen() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PlaybackNavState | null;
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setMuted = usePlayerStore((s) => s.setMuted);

  const player = usePlayback({
    itemId: itemId ?? '',
    isEpisode: state?.isEpisode ?? false,
    initialResumeMs: state?.resumeMs,
    mediaSourceId: state?.mediaSourceId,
  });

  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const displayTimeMs = scrubMs ?? player.currentTimeMs;

  useEffect(() => {
    if (!player.playing || !controlsVisible) return;
    const id = setTimeout(() => setControlsVisible(false), 3500);
    return () => clearTimeout(id);
  }, [player.playing, controlsVisible, player.currentTimeMs]);

  // Keyboard shortcuts: Space play/pause, arrows seek, M mute, Esc back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          player.togglePlay();
          setControlsVisible(true);
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          void player.seekTo(Math.max(0, player.currentTimeMs - 10_000));
          setControlsVisible(true);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          void player.seekTo(player.currentTimeMs + 10_000);
          setControlsVisible(true);
          break;
        case 'm':
          e.preventDefault();
          setMuted(!muted);
          setControlsVisible(true);
          break;
        case 'Escape':
          e.preventDefault();
          navigate(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player, muted, setMuted, navigate]);

  const qualityOptions: TrackOption[] = useMemo(
    () =>
      player.decision?.availableQualities.map((q) => ({
        id: q.id,
        label: q.label,
      })) ?? [],
    [player.decision],
  );

  const audioOptions: TrackOption[] = useMemo(
    () =>
      player.decision?.audioStreams.map((a) => ({
        id: a.id,
        label: a.language?.toUpperCase() ?? 'Audio',
        sublabel: [a.codec, a.channels ? `${a.channels}ch` : null].filter(Boolean).join(' '),
      })) ?? [],
    [player.decision],
  );

  const subtitleOptions: TrackOption[] = useMemo(() => {
    const subs =
      player.decision?.subtitleStreams.map((s) => ({
        id: s.id,
        label: s.language?.toUpperCase() ?? 'Subtitle',
        sublabel: s.format,
      })) ?? [];
    return [{ id: 'off', label: 'Off' }, ...subs];
  }, [player.decision]);

  const title = state?.title ?? 'Now Playing';

  return (
    <div
      className="relative h-screen w-screen bg-black"
      onMouseMove={() => setControlsVisible(true)}
      onClick={() => setControlsVisible((v) => !v)}
      role="application"
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={player.videoRef}
        className="h-full w-full bg-black"
        playsInline
        crossOrigin="anonymous"
      >
        {player.decision?.subtitleStreams.map((s) => (
          <track
            key={s.id}
            id={s.id}
            kind="subtitles"
            srcLang={s.language ?? 'und'}
            label={s.language?.toUpperCase() ?? 'Subtitle'}
            src={subtitleTrackUrl(baseUrl, s.deliveryUrl, token)}
          />
        ))}
      </video>

      {(player.loading || player.buffering) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner className="h-12 w-12" />
        </div>
      )}

      {player.error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-semibold text-white">{player.error}</p>
            <div className="flex gap-3">
              <Button onClick={player.retry}>Retry</Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Go back
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity ${
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="Back">
            ← Back
          </Button>
          <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <Slider.Root
            className="relative flex h-5 w-full touch-none select-none items-center"
            min={0}
            max={Math.max(player.durationMs, 1)}
            step={1000}
            value={[Math.min(displayTimeMs, player.durationMs || displayTimeMs)]}
            onValueChange={([v]) => setScrubMs(v)}
            onValueCommit={([v]) => {
              setScrubMs(null);
              void player.seekTo(v);
            }}
            aria-label="Seek"
          >
            <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20">
              {player.durationMs > 0 &&
                player.bufferedRanges.map((range, i) => {
                  const left = (range.startMs / player.durationMs) * 100;
                  const width = ((range.endMs - range.startMs) / player.durationMs) * 100;
                  return (
                    <div
                      key={`${range.startMs}-${range.endMs}-${i}`}
                      className="absolute inset-y-0 rounded-full bg-white/45"
                      style={{ left: `${left}%`, width: `${Math.max(width, 0)}%` }}
                      aria-hidden
                    />
                  );
                })}
              <Slider.Range className="absolute h-full rounded-full bg-accent" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full bg-accent shadow focus:outline-none" />
          </Slider.Root>

          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              onClick={player.togglePlay}
              aria-label={player.playing ? 'Pause' : 'Play'}
              className="rounded-md px-3 py-1.5 text-lg hover:bg-white/10"
            >
              {player.playing ? '❚❚' : '▶'}
            </button>
            <span className="text-sm tabular-nums text-white/90">
              {formatTime(displayTimeMs)} / {formatTime(player.durationMs)}
            </span>

            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="rounded-md px-2 py-1 text-sm hover:bg-white/10"
            >
              {muted || volume === 0 ? '🔇' : '🔊'}
            </button>
            <Slider.Root
              className="relative flex h-5 w-24 touch-none select-none items-center"
              min={0}
              max={1}
              step={0.05}
              value={[muted ? 0 : volume]}
              onValueChange={([v]) => {
                setVolume(v);
                if (v > 0 && muted) setMuted(false);
              }}
              aria-label="Volume"
            >
              <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-white/25">
                <Slider.Range className="absolute h-full rounded-full bg-white" />
              </Slider.Track>
              <Slider.Thumb className="block h-3 w-3 rounded-full bg-white shadow focus:outline-none" />
            </Slider.Root>

            <div className="ml-auto flex items-center gap-1">
              <TrackMenu
                label="Audio"
                triggerLabel="Audio"
                options={audioOptions}
                selectedId={player.selectedAudioId}
                onSelect={(id) => player.changeAudio(id)}
              />
              <TrackMenu
                label="Subtitles"
                triggerLabel="Subtitles"
                options={subtitleOptions}
                selectedId={player.selectedSubtitleId ?? 'off'}
                onSelect={(id) => void player.changeSubtitle(id === 'off' ? null : id)}
              />
              <TrackMenu
                label="Quality"
                triggerLabel="Quality"
                options={qualityOptions}
                selectedId={player.selectedQualityId}
                onSelect={(id) => player.changeQuality(id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
