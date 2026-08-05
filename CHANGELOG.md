# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.10] - 2026-08-05

### Added

- Torrent library type in settings; player HUD shows TorrServer seeders / peers / download speed.
- Player uses play-time `probedFormat` from ping so torrent codecs update after the server probes the stream.
- Hide placeholder `unknown` codecs in format HUD (no more `UNKNOWN → H.264`).

## [0.1.9] - 2026-08-04

### Added

- Detail meta row shows studios/networks, original title when it differs, and localized series status; episode rows show air date.

## [0.1.7] - 2026-08-02

### Added

- Player HDR→SDR menu lists Off plus server methods (Hardware VAAPI / hable / mobius / reinhard / bt2390) and can switch mid-playback via `hdrToneMapMethod`.

## [0.1.6] - 2026-08-02

### Fixed

- Do not send `forceHdrToSdr` on quality/audio `set-quality` calls so the server keeps the session HDR→SDR flag until the player menu toggles it.

## [0.1.5] - 2026-07-29

### Added

- Ambient theme audio on movie/series detail when the server exposes `themeUrl` (ThemerrDB cache).

### Fixed

- Player sidecar subtitles: fetch WebVTT with Authorization and attach via same-origin blob `<track>` so cues render with hls.js / MSE (query-token `<track src>` failed silently under `crossOrigin`).

## [0.1.4] - 2026-07-29

### Added

- Player menus for HDR→SDR (when source is HDR) and audio channel layout (stereo / 2.1 / 5.1 / mono).
- Admin server setting for HDR→SDR tonemap method (hable / mobius / reinhard / bt2390).
- Web device profile probes HDR via Media Capabilities instead of hardcoding `supportsHdr: false`.
- Player HUD shows source→output format when transcoding (e.g. HEVC HDR → H.264 SDR).
- Movie details and version picker show source video/audio format per media file.

## [0.1.3] - 2026-07-29

### Added

- Mark as unwatched is available for in-progress media (not only fully watched) on details and in the player chrome.
- Player HUD shows estimated network throughput and video/audio format badges (resolution, HDR / Dolby Vision, Atmos / DD+, channel layout).

### Fixed

- ESLint `react-refresh/only-export-components` for watched-status helper (moved out of `MediaFileActions`).
- Player `usePlayback` correctly loads episode `mediaSources` via `isEpisode`.

## [0.1.2] - 2026-07-29

### Fixed

- Player mounts only the selected WebVTT sidecar (not every `deliveryUrl`), so parallel subtitle fetches no longer starve HLS after quality change / seek.
- Switching text subtitles no longer tears down the transcode session; burn-in still re-decides on the server.

## [0.1.1] - 2026-07-26

### Added

- Player audio/subtitle menus show container track titles (dubbing studio / track name) when the server provides them.

### Changed

- CI Docker images are multi-arch (`linux/amd64`, `linux/arm64`), built natively on `ubuntu-latest` + `ubuntu-24.04-arm` (no QEMU).

## [0.1.0] - 2026-07-20

First tagged release. Images are published to Docker Hub (`monowar71/lumenmedia-web`); GitHub Releases carry notes only.

### Added

- Open-source repository scaffolding (license, contributing guide, security policy, CI, issue/PR templates).
- Initial LumenMedia Web client for the LumenMedia stack (auth, libraries, details, HLS / DirectPlay, settings).
- CI publishes `linux/amd64` images to Docker Hub on `main` (`nightly`) and `v*` tags (`latest`, semver).

### Changed

- Distribution channel: Docker Hub instead of GitHub Release assets.

### Fixed

- Move play off grid cards; use series next-up CTA.
- Show buffering as a ring around play; drop skip buttons.
- Remove duplicate play glyph on detail CTAs.

[Unreleased]: https://github.com/monowar71/Lumen-Media-Web/compare/v0.1.7...HEAD
[0.1.7]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.7
[0.1.6]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.6
[0.1.5]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.5
[0.1.4]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.4
[0.1.3]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.3
[0.1.2]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.2
[0.1.1]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.1
[0.1.0]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.0
