# Architecture — LumenMedia Web

Thin React client. Business logic stays on [Lumen-Media-Server](https://github.com/monowar71/Lumen-Media-Server).

```
src/api        # HTTP + TanStack Query + SignalR
src/features   # auth, home, library, details, player, search, settings
src/stores     # zustand client state
src/mocks      # MSW
```

- Server state in TanStack Query; client state in Zustand
- Playback: `<video>` DirectPlay or `hls.js` after `POST /playback/decision`
- OpenAPI → `openapi-typescript` → `src/api/generated/schema.d.ts`

See [AGENTS.md](../AGENTS.md) for player, i18n, and DoD rules.
