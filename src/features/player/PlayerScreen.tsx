import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Slider from '@radix-ui/react-slider';
import { usePlayback } from './usePlayback';
import { TrackMenu, type TrackOption } from './TrackMenu';
import {
  IconAudio,
  IconBack,
  IconFullscreen,
  IconFullscreenExit,
  IconPause,
  IconPlay,
  IconQuality,
  IconSubtitles,
  IconVolume,
  IconVolumeMute,
} from './PlayerIcons';
import { Button } from '@/components/ui/Button';
import { formatTime, formatTrackLanguage } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { PlaybackNavState } from '@/features/details/playbackNav';
import { fetchSubtitleBlobUrl, showVideoTextTracks } from './subtitleSidecar';

function isDocumentFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
}

function isIosTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

type VideoFs = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

async function requestFullscreen(
  el: HTMLElement,
  video?: HTMLVideoElement | null,
): Promise<void> {
  const vid = video as VideoFs | null | undefined;

  // iOS Safari only fullscreens <video> via the legacy webkit API.
  if (isIosTouchDevice() && vid?.webkitEnterFullscreen) {
    vid.webkitEnterFullscreen();
    return;
  }

  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => void;
    webkitRequestFullScreen?: () => void;
  };
  if (el.requestFullscreen) {
    await el.requestFullscreen();
    return;
  }
  if (anyEl.webkitRequestFullscreen) {
    anyEl.webkitRequestFullscreen();
    return;
  }
  if (anyEl.webkitRequestFullScreen) {
    anyEl.webkitRequestFullScreen();
    return;
  }
  // Last resort on mobile WebViews that only expose video FS.
  if (vid?.webkitEnterFullscreen) {
    vid.webkitEnterFullscreen();
  }
}

async function exitFullscreen(video?: HTMLVideoElement | null): Promise<void> {
  const vid = video as VideoFs | null | undefined;
  if (vid?.webkitDisplayingFullscreen && vid.webkitExitFullscreen) {
    vid.webkitExitFullscreen();
    return;
  }
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (document.exitFullscreen && document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  doc.webkitExitFullscreen?.();
}

function ControlButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition',
        'hover:bg-white/12 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PlayerScreen() {
  const { t } = useTranslation('player');
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
  const [scrubbing, setScrubbing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayTimeMs = scrubMs ?? player.currentTimeMs;

  const selectedSubtitle = useMemo(() => {
    const id = player.selectedSubtitleId;
    if (!id) return null;
    return player.decision?.subtitleStreams.find((s) => s.id === id && s.deliveryUrl) ?? null;
  }, [player.selectedSubtitleId, player.decision?.subtitleStreams]);

  // Fetch VTT with Authorization → blob URL so <track> is same-origin (works with MSE/hls.js).
  useEffect(() => {
    if (!selectedSubtitle?.deliveryUrl) {
      setSubtitleBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const ac = new AbortController();
    let objectUrl: string | null = null;
    void fetchSubtitleBlobUrl(baseUrl, selectedSubtitle.deliveryUrl, token, ac.signal)
      .then((url) => {
        objectUrl = url;
        setSubtitleBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setSubtitleBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      });
    return () => {
      ac.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [baseUrl, token, selectedSubtitle?.id, selectedSubtitle?.deliveryUrl]);

  useEffect(() => {
    const video = player.videoRef.current;
    if (!video || !subtitleBlobUrl || !selectedSubtitle) return;
    const enable = () => showVideoTextTracks(video, selectedSubtitle.id);
    enable();
    const trackEl = video.querySelector('track');
    trackEl?.addEventListener('load', enable);
    // Cues may arrive after load; nudge again shortly.
    const t1 = window.setTimeout(enable, 50);
    const t2 = window.setTimeout(enable, 300);
    return () => {
      trackEl?.removeEventListener('load', enable);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [subtitleBlobUrl, selectedSubtitle, player.videoRef]);

  useEffect(() => {
    const sync = () => {
      const vid = player.videoRef.current as VideoFs | null;
      setIsFullscreen(
        isDocumentFullscreen() || Boolean(vid?.webkitDisplayingFullscreen),
      );
    };
    const onWebkitBegin = () => setIsFullscreen(true);
    const onWebkitEnd = () => setIsFullscreen(false);

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    const video = player.videoRef.current;
    video?.addEventListener('webkitbeginfullscreen', onWebkitBegin);
    video?.addEventListener('webkitendfullscreen', onWebkitEnd);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      video?.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
      video?.removeEventListener('webkitendfullscreen', onWebkitEnd);
    };
  }, [player.videoRef]);

  const toggleFullscreen = useCallback(async () => {
    setControlsVisible(true);
    const video = player.videoRef.current;
    try {
      const vid = video as VideoFs | null;
      if (isDocumentFullscreen() || vid?.webkitDisplayingFullscreen) {
        await exitFullscreen(video);
      } else if (rootRef.current) {
        await requestFullscreen(rootRef.current, video);
      }
    } catch {
      // Browser may deny fullscreen without a user gesture or policy.
    }
  }, [player.videoRef]);

  useEffect(() => {
    if (!player.playing || !controlsVisible || scrubbing) return;
    const id = setTimeout(() => setControlsVisible(false), 3200);
    return () => clearTimeout(id);
  }, [player.playing, controlsVisible, player.currentTimeMs, scrubbing]);

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
        case 'f':
          e.preventDefault();
          void toggleFullscreen();
          break;
        case 'Escape':
          if (isDocumentFullscreen()) {
            // Browser exits fullscreen itself; don't navigate away.
            setControlsVisible(true);
            break;
          }
          e.preventDefault();
          navigate(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player, muted, setMuted, navigate, toggleFullscreen]);

  const qualityOptions: TrackOption[] = useMemo(
    () =>
      player.decision?.availableQualities.map((q) => ({
        id: q.id,
        label: q.label,
      })) ?? [],
    [player.decision],
  );

  const hdrOptions: TrackOption[] = useMemo(() => {
    const methods = player.decision?.availableHdrToneMapMethods ?? [];
    if (!player.decision?.sourceHdr || methods.length === 0) return [];
    return [
      { id: 'off', label: t('hdrToSdrOff'), sublabel: t('hdrToSdrOffHint') },
      ...methods.map((m) => ({
        id: m.id,
        label: m.label,
        sublabel: m.hardware ? t('hdrToSdrHwHint') : t('hdrToSdrSwHint'),
      })),
    ];
  }, [player.decision?.sourceHdr, player.decision?.availableHdrToneMapMethods, t]);

  const hdrSelectedId =
    player.forceHdrToSdr || player.decision?.toneMapActive
      ? (player.selectedHdrToneMapMethod ??
        player.decision?.selectedHdrToneMapMethod ??
        player.decision?.availableHdrToneMapMethods?.[0]?.id ??
        'off')
      : 'off';

  const audioLayoutOptions: TrackOption[] = useMemo(
    () =>
      player.decision?.availableAudioLayouts?.map((l) => ({
        id: l.id,
        label: l.label,
      })) ?? [],
    [player.decision],
  );

  const audioOptions: TrackOption[] = useMemo(
    () =>
      player.decision?.audioStreams.map((a) => {
        const language = a.language ? formatTrackLanguage(a.language) : '';
        const title = a.title?.trim() || '';
        return {
          id: a.id,
          label: title || language || t('audioFallback'),
          sublabel: [
            title && language ? language : null,
            a.codec,
            a.channels ? t('channels', { count: a.channels }) : null,
          ]
            .filter(Boolean)
            .join(' '),
        };
      }) ?? [],
    [player.decision, t],
  );

  const subtitleOptions: TrackOption[] = useMemo(() => {
    const subs =
      player.decision?.subtitleStreams.map((s) => {
        const language = s.language ? formatTrackLanguage(s.language) : '';
        const title = s.title?.trim() || '';
        return {
          id: s.id,
          label: title || language || t('subtitleFallback'),
          sublabel: [title && language ? language : null, s.format].filter(Boolean).join(' '),
        };
      }) ?? [];
    return [{ id: 'off', label: t('off') }, ...subs];
  }, [player.decision, t]);

  const title = state?.title ?? t('nowPlaying');
  const methodLabel = useMemo(() => {
    const method = player.decision?.method;
    if (method === 'DirectPlay') return t('modeDirect');
    if (method === 'DirectStream') return t('modeStream');
    if (method === 'Transcode') return t('modeTranscode');
    return null;
  }, [player.decision?.method, t]);

  const qualityLabel =
    qualityOptions.find((q) => q.id === player.selectedQualityId)?.label ?? null;

  const progressPct =
    player.durationMs > 0
      ? Math.min(100, Math.max(0, (displayTimeMs / player.durationMs) * 100))
      : 0;

  const isBuffering = (player.loading || player.buffering) && !player.error;
  const showCenterTransport = !player.error && (isBuffering || controlsVisible || !player.playing);

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative h-screen w-screen overflow-hidden bg-black select-none',
        controlsVisible ? 'cursor-default' : 'cursor-none',
      )}
      onMouseMove={() => setControlsVisible(true)}
      onDoubleClick={() => void toggleFullscreen()}
      onClick={() => setControlsVisible((v) => !v)}
      role="application"
      aria-label={t('ariaPlayer', { title })}
    >
      <video
        ref={player.videoRef}
        className="h-full w-full bg-black object-contain"
        playsInline
        crossOrigin="anonymous"
      >
        {/* Single active sidecar via blob URL (fetch+auth); avoids CORS/MSE track failures. */}
        {selectedSubtitle && subtitleBlobUrl && (
          <track
            key={`${selectedSubtitle.id}:${subtitleBlobUrl}`}
            id={selectedSubtitle.id}
            kind="subtitles"
            srcLang={selectedSubtitle.language ?? 'und'}
            label={
              selectedSubtitle.title?.trim() ||
              (selectedSubtitle.language ? formatTrackLanguage(selectedSubtitle.language) : '') ||
              t('subtitleFallback')
            }
            src={subtitleBlobUrl}
            default
          />
        )}
      </video>

      {/* Soft vignette always present for readable overlays */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          controlsVisible || !player.playing ? 'opacity-100' : 'opacity-0',
          'bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)]',
        )}
        aria-hidden
      />

      {player.error && (
        <div className="absolute inset-0 grid place-items-center bg-black/75 p-6 text-center backdrop-blur-sm">
          <div className="flex max-w-md flex-col items-center gap-5 rounded-3xl border border-white/10 bg-surface/90 p-8 shadow-2xl">
            <p className="text-lg font-semibold text-white">{player.error}</p>
            <div className="flex gap-3">
              <Button onClick={player.retry}>{t('retry')}</Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                {t('goBack')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Center play/pause; buffering = animated ring around the button */}
      {showCenterTransport && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300">
          <div
            className="pointer-events-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {isBuffering && (
              <>
                <span
                  className="pointer-events-none absolute -inset-2 rounded-full border-2 border-white/15"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute -inset-2 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent/50"
                  aria-hidden
                />
                <span className="sr-only" role="status">
                  {t('buffering')}
                </span>
              </>
            )}
            <ControlButton
              label={player.playing ? t('pause') : t('play')}
              onClick={() => {
                player.togglePlay();
                setControlsVisible(true);
              }}
              className="!h-[4.5rem] !w-[4.5rem] bg-accent text-on-accent shadow-lg shadow-accent/30 ring-0 hover:bg-accent-hover"
            >
              {player.playing ? <IconPause size={30} /> : <IconPlay size={30} className="ml-0.5" />}
            </ControlButton>
          </div>
        </div>
      )}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col justify-between transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Top bar */}
        <div
          className={cn(
            'bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 pb-10 pt-4 sm:px-6 sm:pt-5',
            controlsVisible ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <ControlButton label={t('backAria')} onClick={() => navigate(-1)}>
              <IconBack size={22} />
            </ControlButton>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                {title}
              </h1>
              {(methodLabel ||
                qualityLabel ||
                player.networkMbpsLabel ||
                player.videoFormatLabel ||
                player.audioFormatLabel) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/65">
                  {methodLabel && (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-white/80 ring-1 ring-white/10">
                      {methodLabel}
                    </span>
                  )}
                  {qualityLabel && <span>{qualityLabel}</span>}
                  {player.videoFormatLabel && (
                    <span
                      className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-white/80 ring-1 ring-white/10"
                      title={t('videoFormatAria', { format: player.videoFormatLabel })}
                    >
                      {player.videoFormatLabel}
                    </span>
                  )}
                  {player.audioFormatLabel && (
                    <span
                      className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-white/80 ring-1 ring-white/10"
                      title={t('audioFormatAria', { format: player.audioFormatLabel })}
                    >
                      {player.audioFormatLabel}
                    </span>
                  )}
                  {player.networkMbpsLabel && (
                    <span
                      className="rounded-md bg-white/10 px-2 py-0.5 font-medium tabular-nums text-white/80 ring-1 ring-white/10"
                      title={t('networkLoadAria', { rate: player.networkMbpsLabel })}
                    >
                      {t('networkLoad', { rate: player.networkMbpsLabel })}
                    </span>
                  )}
                </div>
              )}
            </div>
            {player.canMarkUnwatched && (
              <button
                type="button"
                disabled={player.markingUnwatched}
                onClick={() => player.markUnwatched()}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white/90',
                  'bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15',
                  'disabled:cursor-wait disabled:opacity-60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                {t('markUnwatched')}
              </button>
            )}
          </div>
        </div>

        {/* Bottom chrome */}
        <div
          className={cn(
            'bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-5 pt-16 sm:px-6 sm:pb-7',
            controlsVisible ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          onClick={(e) => e.stopPropagation()}
        >          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {/* Seek bar */}
            <div className="group relative">
              {scrubbing && (
                <div
                  className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-lg bg-black/80 px-2 py-1 text-xs font-medium tabular-nums text-white ring-1 ring-white/15"
                  style={{ left: `${progressPct}%` }}
                >
                  {formatTime(displayTimeMs)}
                </div>
              )}
              <Slider.Root
                className="relative flex h-6 w-full touch-none select-none items-center"
                min={0}
                max={Math.max(player.durationMs, 1)}
                step={500}
                value={[Math.min(displayTimeMs, player.durationMs || displayTimeMs)]}
                onValueChange={([v]) => {
                  setScrubbing(true);
                  setScrubMs(v);
                  setControlsVisible(true);
                }}
                onValueCommit={([v]) => {
                  setScrubbing(false);
                  setScrubMs(null);
                  void player.seekTo(v);
                }}
                aria-label={t('seek')}
              >
                <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20 transition-[height] group-hover:h-2.5">
                  {player.durationMs > 0 &&
                    player.bufferedRanges.map((range, i) => {
                      const left = (range.startMs / player.durationMs) * 100;
                      const width = ((range.endMs - range.startMs) / player.durationMs) * 100;
                      return (
                        <div
                          key={`${range.startMs}-${range.endMs}-${i}`}
                          className="absolute inset-y-0 rounded-full bg-white/35"
                          style={{ left: `${left}%`, width: `${Math.max(width, 0)}%` }}
                          aria-hidden
                        />
                      );
                    })}
                  <Slider.Range className="absolute h-full rounded-full bg-accent" />
                </Slider.Track>
                <Slider.Thumb
                  className={cn(
                    'block h-4 w-4 rounded-full bg-accent shadow-md shadow-black/40',
                    'opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100',
                    'focus:outline-none focus:ring-2 focus:ring-accent/60',
                    scrubbing && 'opacity-100',
                  )}
                />
              </Slider.Root>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-white sm:gap-3">
              <div className="flex items-center gap-1">
                <ControlButton
                  label={player.playing ? t('pause') : t('play')}
                  onClick={() => player.togglePlay()}
                >
                  {player.playing ? <IconPause size={20} /> : <IconPlay size={20} className="ml-0.5" />}
                </ControlButton>
              </div>

              <span className="min-w-[7.5rem] text-sm tabular-nums text-white/85">
                <span className="text-white">{formatTime(displayTimeMs)}</span>
                <span className="text-white/45"> / {formatTime(player.durationMs)}</span>
              </span>

              <div className="flex items-center gap-1">
                <ControlButton
                  label={muted ? t('unmute') : t('mute')}
                  onClick={() => setMuted(!muted)}
                >
                  {muted || volume === 0 ? <IconVolumeMute size={20} /> : <IconVolume size={20} />}
                </ControlButton>
                <Slider.Root
                  className="relative hidden h-8 w-24 touch-none select-none items-center sm:flex"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[muted ? 0 : volume]}
                  onValueChange={([v]) => {
                    setVolume(v);
                    if (v > 0 && muted) setMuted(false);
                  }}
                  aria-label={t('volume')}
                >
                  <Slider.Track className="relative h-1 w-full grow rounded-full bg-white/25">
                    <Slider.Range className="absolute h-full rounded-full bg-white" />
                  </Slider.Track>
                  <Slider.Thumb className="block h-3.5 w-3.5 rounded-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-accent/50" />
                </Slider.Root>
              </div>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                <TrackMenu
                  label={t('audio')}
                  triggerLabel={t('audio')}
                  icon={<IconAudio size={16} />}
                  options={audioOptions}
                  selectedId={player.selectedAudioId}
                  onSelect={(id) => player.changeAudio(id)}
                />
                <TrackMenu
                  label={t('subtitles')}
                  triggerLabel={t('subtitles')}
                  icon={<IconSubtitles size={16} />}
                  options={subtitleOptions}
                  selectedId={player.selectedSubtitleId ?? 'off'}
                  onSelect={(id) => void player.changeSubtitle(id === 'off' ? null : id)}
                />
                {audioLayoutOptions.length > 1 && (
                  <TrackMenu
                    label={t('audioLayout')}
                    triggerLabel={t('audioLayout')}
                    icon={<IconAudio size={16} />}
                    options={audioLayoutOptions}
                    selectedId={player.selectedAudioLayout}
                    onSelect={(id) => player.changeAudioLayout(id)}
                  />
                )}
                {hdrOptions.length > 0 && (
                  <TrackMenu
                    label={t('hdrToSdr')}
                    triggerLabel={t('hdrToSdr')}
                    icon={<IconQuality size={16} />}
                    options={hdrOptions}
                    selectedId={hdrSelectedId}
                    onSelect={(id) => player.changeHdrToneMapMethod(id)}
                  />
                )}
                <TrackMenu
                  label={t('quality')}
                  triggerLabel={t('quality')}
                  icon={<IconQuality size={16} />}
                  options={qualityOptions}
                  selectedId={player.selectedQualityId}
                  onSelect={(id) => player.changeQuality(id)}
                />
                <ControlButton
                  label={isFullscreen ? t('fullscreenExit') : t('fullscreen')}
                  onClick={() => void toggleFullscreen()}
                >
                  {isFullscreen ? <IconFullscreenExit size={20} /> : <IconFullscreen size={20} />}
                </ControlButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
