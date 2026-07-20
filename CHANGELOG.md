# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/monowar71/Lumen-Media-Web/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/monowar71/Lumen-Media-Web/releases/tag/v0.1.0
