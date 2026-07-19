# LumenMedia Web Client

Веб-клиент LumenMedia на **React + TypeScript + Vite**. Тонкий клиент: вся бизнес-логика на
сервере, клиент отвечает за аутентификацию, навигацию по библиотекам, детали, воспроизведение
(DirectPlay/HLS через `hls.js`), выбор качества/дорожек и синхронизацию прогресса.

> Стек и конвенции зафиксированы в [`AGENTS.md`](./AGENTS.md); API-контракт — в
> [`../docs/api.md`](../docs/api.md).

## Возможности

- **Онбординг / логин** — если сервер ещё не настроен (`setupCompleted: false`), форма создаёт
  первого админа через `POST /setup`, иначе `POST /auth/login`. Access-токен в памяти; refresh в
  `sessionStorage` (сессия переживает F5).
- **Главная** — секции из `GET /api/v1/home` (Continue Watching / Recently Added / Recommended).
- **Библиотека** — виртуализированная сетка (`@tanstack/react-virtual`), infinite scroll,
  сортировка / watched / genre / year / поиск, `srcset` + `?w=&h=` для постеров.
- **Детали фильма** и **сериала** (сезоны → эпизоды, Play next / Resume), admin «Refresh metadata».
- **Плеер** — decision → DirectPlay / HLS (`hls.js` + `autoLevelCapping` под кап), качество на лету,
  аудио/субтитры, volume/mute, клавиатура (Space/J/K/L/M/Esc), прогресс.
- **Поиск** — movies / series / episodes; мобильный поиск в навбаре.
- **Настройки** — URL сервера, LAN/external капы, предпочтения плеера; для Admin — libraries,
  users, server settings, jobs/imports.
- **SignalR** — `/hubs/notifications` инвалидирует кэши библиотек/jobs/прогресса.

## Требования

Только **Docker** — ничего не ставится на хост. Все команды выполняются в образе `node:24`.
Кэш npm вынесен в volume `lumenmedia-npm`, чтобы ускорить повторные установки.

Задайте переменную для краткости команд:

```bash
DRUN='docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24'
```

(запускать из каталога `client_web/`)

## Разработка / сборка / тесты (через Docker)

```bash
# Установка зависимостей
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm install

# Продакшн-сборка (tsc -b && vite build)
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run build

# Тесты (Vitest + React Testing Library + MSW)
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm test

# Регенерация типов из OpenAPI сервера
docker run --rm -v "$PWD":/app -v "$PWD/../server/openapi.json:/openapi.json:ro" -w /app \
  -v lumenmedia-npm:/root/.npm node:24 npx openapi-typescript /openapi.json -o src/api/generated/schema.d.ts

# Playwright E2E (нужны поднятые API :8096 и Vite :5173)
docker run --rm --network host \
  -v "$PWD":/app -v lumenmedia-pw:/ms-playwright -w /app \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -e PLAYWRIGHT_BASE_URL=http://localhost:5173 \
  mcr.microsoft.com/playwright:v1.52.0-noble npx playwright test

# Линт (ESLint, warnings = ошибки в CI)
docker run --rm -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run lint

# Dev-сервер (доступен на http://localhost:5173)
docker run --rm -it -p 5173:5173 -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run dev
```

> Если после установки npm сообщает `allow-scripts ... msw (install scripts)`, воркер MSW для
> браузера можно доустановить вручную: `... node:24 npx msw init public --no-save`
> (файл `public/mockServiceWorker.js` уже закоммичен, так что обычно это не требуется).

## Подключение к бэкенду

Базовый URL API конфигурируется тремя способами (по приоритету):

1. **Экран настроек / логина** — поле «Server URL» (сохраняется в `localStorage`, ключ
   `lumenmedia.settings`). Это основной способ в рантайме.
2. **Переменная окружения** `VITE_API_BASE_URL` (см. [`.env.example`](./.env.example)) — значение
   по умолчанию при первом запуске.
3. Если ничего не задано — URL выводится из hostname страницы: на `localhost` →
   `http://localhost:8096`, при открытии UI по LAN-IP → `http://<тот-же-ip>:8096`.
   Сохранённый `localhost` автоматически переписывается, если UI открыт с другого устройства.

Клиент общается по путям `"/api/v1/..."`, добавляя к ним базовый URL. Артворк/стрим-URL, которые
сервер возвращает как относительные пути, тоже префиксуются базовым URL.

## Доступ из локальной сети

API (`8096`) и Vite (`5173`) уже слушают `0.0.0.0`. С телефона/ТВ в той же Wi‑Fi:

1. Узнайте IP компьютера (на macOS: `ipconfig getifaddr en0`).
2. Откройте `http://<ip>:5173`.
3. Server URL должен стать `http://<ip>:8096` автоматически (проверьте на экране логина).

Если страница не открывается — проверьте, что порты проброшены (`0.0.0.0:5173`, `0.0.0.0:8096`)
и firewall macOS разрешает входящие для Docker.

## Запуск без бэкенда (MSW-моки)

Бэкенд ещё разрабатывается, поэтому есть моки **Mock Service Worker**, повторяющие формы из
`docs/api.md`.

- **В браузере (dev):** установите `VITE_ENABLE_MOCKS=true` и запустите dev-сервер:

  ```bash
  docker run --rm -it -p 5173:5173 \
    -e VITE_ENABLE_MOCKS=true \
    -v "$PWD":/app -w /app -v lumenmedia-npm:/root/.npm node:24 npm run dev
  ```

  Логиньтесь с любым непустым логином/паролем. Данные — из `src/mocks/data.ts`.

- **В тестах:** MSW стартует автоматически (`src/test/setup.ts`, `setupServer`), обработчики —
  `src/mocks/handlers.ts`.

## Структура проекта

```
client_web/
├── index.html
├── vite.config.ts            # Vite + Vitest (jsdom) + alias @ -> src
├── eslint.config.js          # ESLint flat config (strict TS + hooks + prettier)
├── public/mockServiceWorker.js
└── src/
    ├── api/                  # типизированный клиент к docs/api.md
    │   ├── types.ts          #   DTO/enum'ы (замена сгенерированного SDK)
    │   ├── http.ts           #   axios + интерцепторы (auth, refresh, Problem Details)
    │   ├── endpoints.ts      #   типизированные функции эндпоинтов
    │   ├── queries.ts        #   хуки TanStack Query
    │   ├── queryClient.ts    #   staleTime/gcTime
    │   └── session.ts        #   мост HTTP ↔ сторы
    ├── app/                  # провайдеры, роутер, layout, guard
    ├── features/
    │   ├── auth/             # LoginScreen + refresh
    │   ├── home/             # HomeScreen
    │   ├── library/          # LibraryScreen (виртуализация, фильтры)
    │   ├── details/          # Movie/Series detail
    │   ├── player/           # PlayerScreen, usePlayback, attachSource, playbackSource
    │   ├── search/           # SearchScreen
    │   └── settings/         # SettingsScreen
    ├── components/           # переиспользуемые UI-компоненты
    ├── stores/               # zustand: auth / settings / player
    ├── lib/                  # deviceProfile, artwork, network, format, utils
    ├── mocks/                # MSW: data, handlers, browser, server
    └── test/                 # setup + утилиты рендера
```

## Как типизированный клиент соответствует `docs/api.md`

- OpenAPI-схема (`../server/openapi.json`) → `npm run generate:api` →
  `src/api/generated/schema.d.ts` (openapi-typescript). Enum'ы и ряд DTO реэкспортируются в
  `src/api/types.ts`; UI-facing детали смягчают quirks `number|string` у int64.
- Каждый эндпоинт из таблицы §4 представлен функцией в `src/api/endpoints.ts`.
- Ошибки разбираются как **RFC 9457 Problem Details** (`toErrorMessage`).
- Real-time: `@microsoft/signalr` → `src/api/realtime.ts` (JobProgress / LibraryUpdated / PlaybackSync).
- Это **openapi-typescript** поверх `server/openapi.json` (`npm run generate:api`). Ручные
  алиасы в `types.ts` не правят schema.d.ts.

## Тестирование

- **Vitest + React Testing Library + MSW** (jsdom). Быстрый прогон: `npm test`.
- Покрыто: логин; session restore; библиотека + фильтры; decision→source; quality/audio selector.
- **Playwright E2E** (`e2e/smoke.spec.ts`): login → library → item → player (против живого API).

## Управление ресурсами

- Инстанс `hls.js` уничтожается на unmount; слушатели `<video>` снимаются в cleanup.
- Изображения ленивые и запрашиваются под размер карточки (`?w=&h=` + DPR).
- Длинные списки виртуализированы; тяжёлый чанк плеера (`hls.js`) грузится только на маршруте плеера.
- Прогресс — по событиям/таймеру, поллинг останавливается на скрытой вкладке; keep-alive ping сессии.
- Разумные `staleTime`/`gcTime` в TanStack Query.
