# LumenMedia Web

[![CI](https://github.com/monowar71/Lumen-Media-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/monowar71/Lumen-Media-Web/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

**React + TypeScript + Vite** web client for LumenMedia. Thin UI over [Lumen-Media-Server](https://github.com/monowar71/Lumen-Media-Server): auth, libraries, details, HLS (`hls.js`) / DirectPlay, quality & tracks, progress sync, SignalR invalidation.

## Features

- Onboarding / login (setup or auth)
- Home shelves, virtualized library grid, movie & series details
- Player with decision → DirectPlay or HLS, keyboard shortcuts, caps
- Search, settings (LAN/external caps), admin libraries / users / jobs
- i18n (`ru` default, `en` fallback), MSW mocks for offline UI work

## Quick start (Docker — no host Node required)

```bash
git clone https://github.com/monowar71/Lumen-Media-Web.git
cd Lumen-Media-Web

docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm install

# Dev server → http://localhost:5173
docker run --rm -it -p 5173:5173 -v "$PWD":/app -w /app \
  -v lumenmedia-npm:/root/.npm node:24 npm run dev

# Tests / lint / build
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm test
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run lint
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run build
```

Point the UI at a running server (login screen **Server URL**, or `VITE_API_BASE_URL` — see [`.env.example`](.env.example)). Defaults: `localhost` → `http://localhost:8096`.

### OpenAPI types

When developing next to a server checkout:

```bash
docker run --rm -v "$PWD":/app -v /path/to/Lumen-Media-Server/openapi.json:/openapi.json:ro \
  -w /app -v lumenmedia-npm:/root/.npm node:24 \
  npx openapi-typescript /openapi.json -o src/api/generated/schema.d.ts
```

Or download `openapi.json` from a running server (`GET /openapi/v1.json`).

## Architecture

| Area | Role |
| --- | --- |
| `src/api` | Typed HTTP client, TanStack Query hooks, SignalR |
| `src/features` | Auth, home, library, details, player, search, settings |
| `src/stores` | Zustand (session / settings / player) |
| `src/mocks` | MSW handlers for tests and optional browser mocks |

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [AGENTS.md](AGENTS.md)

## Related repositories

| Repo | Role |
| --- | --- |
| [Lumen-Media-Server](https://github.com/monowar71/Lumen-Media-Server) | Backend API + transcoding |
| [Lumen-Media-iOS](https://github.com/monowar71/Lumen-Media-iOS) | iOS / iPad client |
| [Lumen-Media-Android](https://github.com/monowar71/Lumen-Media-Android) | Android / Android TV client |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Security: [SECURITY.md](SECURITY.md).

## License

[GNU General Public License v3.0](LICENSE)

Copyright © 2026 Alexander Goncharow and contributors.
