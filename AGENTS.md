# AGENTS.md — client_web (Web)

Веб-клиент FreePlex на TypeScript + React (Vite). Сначала прочитай корневой [../AGENTS.md](../AGENTS.md) и [../docs/clients.md](../docs/clients.md).

## Стек

- **TypeScript** (strict), **React** (функциональные компоненты + хуки), сборка **Vite**.
- **TanStack Query** для серверного состояния (кэш, инвалидация) поверх сгенерированного SDK.
- **Zustand** для лёгкого клиентского состояния (сессия, плеер, UI).
- Плеер: `<video>` + **Shaka Player** (или hls.js) для HLS; DirectPlay — прямой `src`.
- UI: современная библиотека компонентов (Radix UI + Tailwind, либо MUI) — красивый, доступный интерфейс.
- Роутинг: React Router / TanStack Router.

## Архитектура

```
client_web/
├── index.html
├── vite.config.ts
├── src/
│   ├── api/                 # сгенерированный SDK (orval) + queryClient
│   ├── app/                 # роутинг, провайдеры, layout
│   ├── features/            # auth, library, details, player, settings
│   ├── components/          # переиспользуемые UI-компоненты
│   ├── stores/              # zustand-сторы
│   ├── i18n/                # i18next: locales/en|ru + init
│   └── lib/                 # утилиты, device profile
```

- Разделение: **серверное состояние** (TanStack Query) vs **клиентское** (Zustand) — не смешивать.
- Компоненты по возможности stateless/презентационные; данные приходят через хуки-запросы.
- SDK не редактируется руками — генерируется из OpenAPI (см. [../docs/api.md](../docs/api.md)).
- Токены — в памяти + refresh; чувствительное не кладём в localStorage без необходимости.

## Плеер

- Device profile для веба: браузерная поддержка HEVC ограничена → как правило `videoCodecs: ["h264"]`, `containers: ["hls","mp4"]`.
- `POST /playback/decision` → DirectPlay (`<video src>`) или HLS через Shaka/hls.js.
- Управление дорожками аудио/субтитров через API плеера; субтитры — WebVTT.
- **Выбор качества:** UI-селектор со списком `availableQualities`. Auto → `master.m3u8` (ABR hls.js/Shaka). Manual → hls.js `currentLevel`/`autoLevelCapping` или Shaka `selectVariantTrack`/`configure({abr})`. Смена на лету: `set-quality` + подмена источника + seek на позицию.
- **Сеть/кап:** отдельный кап для внешнего подключения; ориентировочный тип сети через `navigator.connection` (где доступно); подставлять `maxBitrateKbps`.
- **Нестабильная сеть:** полагаться на ABR (понижение качества вместо паузы); индикатор буферизации; повтор с backoff.
- Прогресс: `PUT /progress` по таймеру и на `pause`/`beforeunload`.

## Конвенции

- ESLint + Prettier, строгий TS (`strict: true`), предупреждения = ошибки в CI.
- Доступность (a11y): фокус, роли, клавиатурная навигация.
- Отзывчивость: desktop и mobile-браузеры.
- **i18n:** `i18next` + `react-i18next`. Каталоги в `src/i18n/locales/{ru,en}/*.json` (namespaces: `common`, `auth`, `library`, `details`, `player`, `settings`, `errors`). Дефолт UI — `ru`, fallback — `en`. Ключи стабильные dotted (`settings.save`), не сырой английский текст. Новые UI-строки — только через `t(...)`, без хардкода. Локаль пользователя в `settingsStore.locale` (persist). Язык метаданных на сервере — отдельно (admin Server settings).

## Контроль ресурсов (CPU/ОЗУ)

- Уничтожать инстанс плеера (Shaka/hls.js `destroy()`) при размонтировании; снимать слушатели событий.
- Изображения через нужные размеры с сервера (`?w=&h=`), `loading="lazy"`, `srcset`; не тянуть 4K-постер в мелкую карточку.
- Виртуализация длинных списков (`@tanstack/react-virtual`); мемоизация тяжёлых компонентов.
- TanStack Query с разумными `staleTime`/`gcTime` — не дублировать запросы и не держать кэш вечно; отменять запросы при уходе.
- Никаких `setInterval`-поллингов на неактивных вкладках; чистить эффекты (`useEffect` cleanup); прогресс — по событиям.
- Проверять память/CPU в DevTools Performance/Memory; следить за утечками при навигации.

## Тестирование

- **Vitest + React Testing Library** — компоненты и хуки.
- **MSW** (Mock Service Worker) для мокинга API в тестах.
- **Playwright** — E2E критических путей: логин → библиотека → детали → воспроизведение.

## Definition of Done

- `vite build` проходит, линтеры/тесты зелёные.
- Работает с реальным сервером (dev) и под MSW.
- Обновлён SDK при изменении API.
