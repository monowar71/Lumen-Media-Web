import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/api/endpoints';
import { toErrorMessage } from '@/api/http';
import type { PlaybackDecisionResponse, PlaybackMode } from '@/api/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { buildWebDeviceProfile } from '@/lib/deviceProfile';
import { detectConnectionKind } from '@/lib/network';
import { resolvePlaybackSource } from './playbackSource';
import { attachSource, type AttachHandle } from './attachSource';
import { canLocalSeek } from './seekHelpers';

export interface BufferRange {
  startMs: number;
  endMs: number;
}

export interface UsePlaybackArgs {
  itemId: string;
  isEpisode: boolean;
  initialResumeMs: number | undefined;
  mediaSourceId?: string;
}

export interface PlaybackController {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  decision: PlaybackDecisionResponse | null;
  loading: boolean;
  error: string | null;
  buffering: boolean;
  playing: boolean;
  currentTimeMs: number;
  durationMs: number;
  /** Buffered ranges from the media element, scaled to the known full duration. */
  bufferedRanges: BufferRange[];
  selectedQualityId: string;
  selectedAudioId: string | null;
  selectedSubtitleId: string | null;
  togglePlay: () => void;
  seekTo: (ms: number) => void | Promise<void>;
  changeQuality: (qualityId: string) => void;
  changeAudio: (audioId: string) => void;
  changeSubtitle: (subtitleId: string | null) => void;
  retry: () => void;
}

const PROGRESS_INTERVAL_MS = 10_000;
const PING_INTERVAL_MS = 30_000;

function toMs(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function readBufferedRanges(video: HTMLVideoElement, timelineOffsetMs: number): BufferRange[] {
  const ranges: BufferRange[] = [];
  const buffered = video.buffered;
  for (let i = 0; i < buffered.length; i += 1) {
    const start = buffered.start(i);
    const end = buffered.end(i);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    ranges.push({
      startMs: timelineOffsetMs + start * 1000,
      endMs: timelineOffsetMs + end * 1000,
    });
  }
  return ranges;
}

function applyKnownDuration(
  knownMs: number,
  videoDurationMs: number,
  setDurationMs: (ms: number) => void,
  durationMsRef: React.MutableRefObject<number>,
): void {
  // HLS EVENT playlists report only segments written so far; never shrink below
  // the probed server duration, and grow if the element eventually knows more.
  const finiteVideo = Number.isFinite(videoDurationMs) ? videoDurationMs : 0;
  const next = Math.max(knownMs, finiteVideo, durationMsRef.current);
  if (next > 0 && next !== durationMsRef.current) {
    durationMsRef.current = next;
    setDurationMs(next);
  }
}

/** Coalesce rapid scrubbing so we don't spawn overlapping ffmpeg sessions. */
const SEEK_REMOTE_DEBOUNCE_MS = 350;
/** If a local scrub stalls this long, escalate to an ffmpeg -ss restart. */
const SEEK_STALL_ESCALATE_MS = 2_500;

export function usePlayback({
  itemId,
  initialResumeMs,
  mediaSourceId,
}: UsePlaybackArgs): PlaybackController {
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const capForConnection = useSettingsStore((s) => s.capForConnection);
  const preferredMode = usePlayerStore((s) => s.preferredMode);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);

  const connectionKind = (() => {
    try {
      return detectConnectionKind(new URL(baseUrl).hostname);
    } catch {
      return detectConnectionKind();
    }
  })();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const attachRef = useRef<AttachHandle | null>(null);
  const positionMsRef = useRef(0);
  const durationMsRef = useRef(0);
  const decisionRef = useRef<PlaybackDecisionResponse | null>(null);
  /**
   * Absolute media timeline origin for the current HLS session. ffmpeg starts
   * with -ss at this point, so <video>.currentTime is relative (0 = offset).
   * DirectPlay keeps this at 0 (file timestamps are absolute).
   */
  const timelineOffsetMsRef = useRef(0);
  /** Bumped on unmount / restart so in-flight decisions are discarded and stopped. */
  const epochRef = useRef(0);
  const seekEpochRef = useRef(0);
  const pendingRemoteSeekMsRef = useRef<number | null>(null);
  const remoteSeekInFlightRef = useRef(false);
  const remoteSeekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamCacheTokenRef = useRef(0);

  const [decision, setDecision] = useState<PlaybackDecisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [bufferedRanges, setBufferedRanges] = useState<BufferRange[]>([]);
  const [selectedQualityId, setSelectedQualityId] = useState('auto');
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);

  const stopSession = useCallback((sessionId: string | null | undefined) => {
    if (!sessionId) return;
    void api.stopSession(sessionId).catch(() => {
      /* best-effort — avoids leaking ffmpeg slots (429) */
    });
  }, []);

  const releaseCurrentSession = useCallback(() => {
    const sid = decisionRef.current?.sessionId;
    decisionRef.current = null;
    stopSession(sid);
  }, [stopSession]);

  const report = useCallback(
    (state: 'playing' | 'paused' | 'stopped') => {
      const d = decisionRef.current;
      if (!d || durationMsRef.current <= 0) return;
      void api
        .putProgress(itemId, {
          positionMs: Math.round(positionMsRef.current),
          durationMs: Math.round(durationMsRef.current),
          sessionId: d.sessionId,
          state,
        })
        .catch(() => {
          /* progress is best-effort and resilient to drops */
        });
    },
    [itemId],
  );

  const clearStallWatch = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const attachDecision = useCallback(
    (next: PlaybackDecisionResponse) => {
      const video = videoRef.current;
      if (!video) return;
      attachRef.current?.destroy();
      clearStallWatch();

      streamCacheTokenRef.current += 1;
      const source = resolvePlaybackSource(
        next,
        baseUrl,
        `${toMs(next.startPositionMs)}-${streamCacheTokenRef.current}`,
      );
      const token = useAuthStore.getState().accessToken;
      const cap = capForConnection(connectionKind);
      attachRef.current = attachSource(video, source, {
        accessToken: token,
        maxBitrateKbps: cap,
        onError: (msg) => setError(msg),
        onBuffering: setBuffering,
      });

      video.volume = volume;
      video.muted = muted;

      const startMs = toMs(next.startPositionMs) || (next.startPositionMs ?? 0);
      // HLS/fMP4 from ffmpeg -ss is 0-based; only DirectPlay uses absolute timestamps.
      const isDirect = next.method === 'DirectPlay';
      timelineOffsetMsRef.current = isDirect ? 0 : startMs;
      positionMsRef.current = startMs;
      setCurrentTimeMs(startMs);
      setBufferedRanges([]);

      const onLoaded = () => {
        if (isDirect && startMs > 0) {
          video.currentTime = startMs / 1000;
        }
        void video.play().catch(() => {
          /* autoplay may be blocked; user can press play */
        });
        video.removeEventListener('loadedmetadata', onLoaded);
      };
      video.addEventListener('loadedmetadata', onLoaded);
      if (video.readyState >= 1) onLoaded();
      else if (!isDirect || startMs <= 0) {
        void video.play().catch(() => {});
      }
    },
    [baseUrl, capForConnection, connectionKind, volume, muted, clearStallWatch],
  );

  const start = useCallback(async () => {
    const epoch = ++epochRef.current;
    const previousSid = decisionRef.current?.sessionId;
    decisionRef.current = null;
    stopSession(previousSid);
    attachRef.current?.destroy();
    attachRef.current = null;

    setLoading(true);
    setError(null);
    try {
      let resumeMs = initialResumeMs;
      if (resumeMs === undefined) {
        const progress = await api.getProgress(itemId).catch(() => null);
        resumeMs = progress?.positionMs ?? 0;
      }

      const cap = capForConnection(connectionKind);
      const profile = buildWebDeviceProfile({ maxBitrateKbps: cap });

      const mode = preferredMode;
      const next = await api.playbackDecision({
        mediaId: itemId,
        mediaSourceId,
        mode,
        // Manual mode requires an explicit rung; default to original until the
        // user picks another quality in the player menu.
        qualityId: mode === 'manual' ? 'original' : null,
        resumePositionMs: resumeMs,
        profile,
      });

      // React Strict Mode remounts before the first decision returns — stop the
      // orphaned session so it does not consume a transcode slot (API 429).
      if (epoch !== epochRef.current) {
        stopSession(next.sessionId);
        return;
      }

      decisionRef.current = next;
      setDecision(next);
      setSelectedQualityId(next.selectedQualityId);
      setSelectedAudioId(
        next.audioStreams.find((a) => a.isDefault)?.id ?? next.audioStreams[0]?.id ?? null,
      );
      setSelectedSubtitleId(null);
      positionMsRef.current = next.startPositionMs ?? 0;
      const known = toMs(next.durationMs);
      if (known > 0) {
        durationMsRef.current = known;
        setDurationMs(known);
      }
      setBufferedRanges([]);
      attachDecision(next);
      setLoading(false);
    } catch (err) {
      if (epoch !== epochRef.current) return;
      setError(toErrorMessage(err, 'Could not start playback'));
      setLoading(false);
    }
  }, [
    itemId,
    initialResumeMs,
    mediaSourceId,
    capForConnection,
    connectionKind,
    attachDecision,
    preferredMode,
    stopSession,
  ]);

  // Start once on mount; stop + release everything on unmount.
  useEffect(() => {
    void start();
    return () => {
      epochRef.current += 1;
      seekEpochRef.current += 1;
      pendingRemoteSeekMsRef.current = null;
      if (remoteSeekTimerRef.current) {
        clearTimeout(remoteSeekTimerRef.current);
        remoteSeekTimerRef.current = null;
      }
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      report('stopped');
      releaseCurrentSession();
      attachRef.current?.destroy();
      attachRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Wire <video> events.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const syncBuffer = () =>
      setBufferedRanges(readBufferedRanges(video, timelineOffsetMsRef.current));
    const onTime = () => {
      const absolute = timelineOffsetMsRef.current + video.currentTime * 1000;
      positionMsRef.current = absolute;
      setCurrentTimeMs(absolute);
      syncBuffer();
    };
    const onDuration = () => {
      const known = toMs(decisionRef.current?.durationMs);
      const fromElement =
        Number.isFinite(video.duration) && video.duration > 0
          ? timelineOffsetMsRef.current + video.duration * 1000
          : 0;
      applyKnownDuration(known, fromElement, setDurationMs, durationMsRef);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      report('paused');
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      clearStallWatch();
    };
    const onEnded = () => report('stopped');
    const onSeeked = () => {
      // Successful local scrub — cancel stall escalation.
      if (!video.paused && video.readyState >= 2) clearStallWatch();
    };

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('progress', syncBuffer);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('seeked', onSeeked);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('progress', syncBuffer);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [report, clearStallWatch]);

  // Periodic progress reporting only while actively playing and tab visible
  // (no polling on hidden tabs — resource discipline).
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) report('playing');
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, report]);

  // Keep-alive ping so the server extends the transcode session.
  useEffect(() => {
    const sid = decision?.sessionId;
    if (!sid) return;
    const id = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        void api.pingSession(sid).catch(() => {});
      }
    }, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [decision?.sessionId]);

  // Persist position when the tab is hidden or the page unloads.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) report('paused');
    };
    const onUnload = () => report('paused');
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [report]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }, []);

  const flushRemoteSeek = useCallback(async () => {
    if (remoteSeekInFlightRef.current) return;

    const target = pendingRemoteSeekMsRef.current;
    if (target == null) return;
    pendingRemoteSeekMsRef.current = null;

    const d = decisionRef.current;
    const video = videoRef.current;
    if (!d || d.method === 'DirectPlay' || !video) return;

    const offset = timelineOffsetMsRef.current;
    const relativeMs = target - offset;
    if (canLocalSeek(video, relativeMs) && attachRef.current) {
      clearStallWatch();
      video.currentTime = Math.max(0, relativeMs) / 1000;
      positionMsRef.current = target;
      setCurrentTimeMs(target);
      return;
    }

    const seekEpoch = ++seekEpochRef.current;
    const restartTarget = Math.round(target);
    remoteSeekInFlightRef.current = true;
    setBuffering(true);
    setError(null);
    clearStallWatch();
    // Drop the stale HLS attachment immediately so the UI doesn't keep stalling
    // on a playlist that will never contain the scrub target.
    attachRef.current?.destroy();
    attachRef.current = null;

    try {
      // Restart the SAME session at the new position (seek → ffmpeg -ss).
      const next = await api.seekSession(d.sessionId, {
        positionMs: restartTarget,
      });

      // A newer scrub won while we waited — don't attach the stale restart.
      if (
        seekEpoch !== seekEpochRef.current ||
        pendingRemoteSeekMsRef.current != null
      ) {
        return;
      }

      next.startPositionMs = restartTarget;
      decisionRef.current = next;
      setDecision(next);
      const known = toMs(next.durationMs);
      if (known > 0) {
        durationMsRef.current = Math.max(durationMsRef.current, known);
        setDurationMs(durationMsRef.current);
      }
      attachDecision(next);
    } catch (err) {
      if (seekEpoch !== seekEpochRef.current) return;
      setError(toErrorMessage(err, 'Could not seek'));
      setBuffering(false);
    } finally {
      remoteSeekInFlightRef.current = false;
      if (pendingRemoteSeekMsRef.current != null) {
        void flushRemoteSeek();
      }
    }
  }, [attachDecision, clearStallWatch]);

  const scheduleRemoteSeek = useCallback(
    (targetMs: number) => {
      pendingRemoteSeekMsRef.current = targetMs;
      if (remoteSeekTimerRef.current) clearTimeout(remoteSeekTimerRef.current);
      remoteSeekTimerRef.current = setTimeout(() => {
        remoteSeekTimerRef.current = null;
        void flushRemoteSeek();
      }, SEEK_REMOTE_DEBOUNCE_MS);
    },
    [flushRemoteSeek],
  );

  const watchLocalSeekStall = useCallback(
    (absoluteTargetMs: number) => {
      clearStallWatch();
      stallTimerRef.current = setTimeout(() => {
        stallTimerRef.current = null;
        const video = videoRef.current;
        const d = decisionRef.current;
        if (!video || !d || d.method === 'DirectPlay') return;
        // Still not playing near the scrub point → escalate to ffmpeg restart.
        if (video.seeking || video.readyState < 2) {
          scheduleRemoteSeek(absoluteTargetMs);
        }
      }, SEEK_STALL_ESCALATE_MS);
    },
    [clearStallWatch, scheduleRemoteSeek],
  );

  const seekTo = useCallback(
    (ms: number) => {
      const video = videoRef.current;
      const d = decisionRef.current;
      if (!video || !d) return;

      const duration = durationMsRef.current;
      const target = Math.max(0, duration > 0 ? Math.min(ms, duration) : ms);
      positionMsRef.current = target;
      setCurrentTimeMs(target);

      if (d.method === 'DirectPlay') {
        timelineOffsetMsRef.current = 0;
        clearStallWatch();
        video.currentTime = target / 1000;
        return;
      }

      const relativeMs = target - timelineOffsetMsRef.current;
      if (canLocalSeek(video, relativeMs) && !remoteSeekInFlightRef.current && attachRef.current) {
        pendingRemoteSeekMsRef.current = null;
        if (remoteSeekTimerRef.current) {
          clearTimeout(remoteSeekTimerRef.current);
          remoteSeekTimerRef.current = null;
        }
        video.currentTime = Math.max(0, relativeMs) / 1000;
        watchLocalSeekStall(target);
        return;
      }

      scheduleRemoteSeek(target);
    },
    [scheduleRemoteSeek, watchLocalSeekStall, clearStallWatch],
  );

  const changeQuality = useCallback(
    async (qualityId: string) => {
      const d = decisionRef.current;
      if (!d || qualityId === selectedQualityId) return;
      const resumePositionMs = Math.round(positionMsRef.current);
      const mode: PlaybackMode = qualityId === 'auto' ? 'auto' : 'manual';
      setSelectedQualityId(qualityId);
      setBuffering(true);
      try {
        const next = await api.setQuality(d.sessionId, { qualityId, mode, resumePositionMs });
        next.startPositionMs = resumePositionMs;
        decisionRef.current = next;
        setDecision(next);
        attachDecision(next);
      } catch (err) {
        setError(toErrorMessage(err, 'Could not change quality'));
      }
    },
    [selectedQualityId, attachDecision],
  );

  const changeAudio = useCallback(
    async (audioId: string) => {
      const d = decisionRef.current;
      if (!d || audioId === selectedAudioId) return;
      const resumePositionMs = Math.round(positionMsRef.current);
      const previousSid = d.sessionId;
      setSelectedAudioId(audioId);
      setBuffering(true);
      try {
        // Free the slot before opening a replacement session (avoids 429 on rapid changes).
        stopSession(previousSid);
        decisionRef.current = null;
        const cap = capForConnection(connectionKind);
        const profile = buildWebDeviceProfile({ maxBitrateKbps: cap });
        const next = await api.playbackDecision({
          mediaId: itemId,
          mediaSourceId,
          mode: d.mode,
          qualityId: d.mode === 'manual' ? selectedQualityId : null,
          audioStreamId: audioId,
          subtitleStreamId: selectedSubtitleId,
          resumePositionMs,
          profile,
        });
        next.startPositionMs = resumePositionMs;
        decisionRef.current = next;
        setDecision(next);
        const known = toMs(next.durationMs);
        if (known > 0) {
          durationMsRef.current = Math.max(durationMsRef.current, known);
          setDurationMs(durationMsRef.current);
        }
        attachDecision(next);
      } catch (err) {
        setError(toErrorMessage(err, 'Could not change audio track'));
      }
    },
    [
      selectedAudioId,
      selectedQualityId,
      selectedSubtitleId,
      itemId,
      mediaSourceId,
      capForConnection,
      connectionKind,
      attachDecision,
      stopSession,
    ],
  );

  // Keep volume/mute in sync with persisted player preferences.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  // Text subtitles: prefer server decision when switching (burn-in / track remap),
  // then toggle native text tracks for WebVTT sidecars.
  const changeSubtitle = useCallback(
    async (subtitleId: string | null) => {
      setSelectedSubtitleId(subtitleId);
      const d = decisionRef.current;
      const video = videoRef.current;
      if (video) {
        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i += 1) {
          const track = tracks[i];
          const match =
            subtitleId != null &&
            (track.id === subtitleId || track.label === subtitleId || String(i) === subtitleId);
          track.mode = match ? 'showing' : 'disabled';
        }
      }
      if (!d || !subtitleId) return;
      const resumePositionMs = Math.round(positionMsRef.current);
      const previousSid = d.sessionId;
      try {
        stopSession(previousSid);
        decisionRef.current = null;
        const cap = capForConnection(connectionKind);
        const profile = buildWebDeviceProfile({ maxBitrateKbps: cap });
        const next = await api.playbackDecision({
          mediaId: itemId,
          mediaSourceId,
          mode: d.mode,
          qualityId: d.mode === 'manual' ? selectedQualityId : null,
          audioStreamId: selectedAudioId,
          subtitleStreamId: subtitleId,
          resumePositionMs,
          profile,
        });
        next.startPositionMs = resumePositionMs;
        decisionRef.current = next;
        setDecision(next);
        const known = toMs(next.durationMs);
        if (known > 0) {
          durationMsRef.current = Math.max(durationMsRef.current, known);
          setDurationMs(durationMsRef.current);
        }
        attachDecision(next);
      } catch {
        /* keep client-side track toggle even if server round-trip fails */
      }
    },
    [
      itemId,
      mediaSourceId,
      selectedQualityId,
      selectedAudioId,
      capForConnection,
      connectionKind,
      attachDecision,
      stopSession,
    ],
  );

  const retry = useCallback(() => void start(), [start]);

  return {
    videoRef,
    decision,
    loading,
    error,
    buffering,
    playing,
    currentTimeMs,
    durationMs,
    bufferedRanges,
    selectedQualityId,
    selectedAudioId,
    selectedSubtitleId,
    togglePlay,
    seekTo,
    changeQuality,
    changeAudio,
    changeSubtitle,
    retry,
  };
}
