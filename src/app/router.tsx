import { createBrowserRouter, Navigate } from 'react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppLayout } from './layout/AppLayout';
import { RequireAuth } from './RequireAuth';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { FullPageSpinner } from '@/components/ui/Spinner';

// Code-split heavier routes (details, library grid, and the hls.js-backed
// player) so they are only downloaded when needed (resource discipline).
const LibraryScreen = lazy(() =>
  import('@/features/library/LibraryScreen').then((m) => ({ default: m.LibraryScreen })),
);
const ItemDetailScreen = lazy(() =>
  import('@/features/details/ItemDetailScreen').then((m) => ({ default: m.ItemDetailScreen })),
);
const SearchScreen = lazy(() =>
  import('@/features/search/SearchScreen').then((m) => ({ default: m.SearchScreen })),
);
const HistoryScreen = lazy(() =>
  import('@/features/history/HistoryScreen').then((m) => ({ default: m.HistoryScreen })),
);
const SettingsScreen = lazy(() =>
  import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const PlayerScreen = lazy(() =>
  import('@/features/player/PlayerScreen').then((m) => ({ default: m.PlayerScreen })),
);

function lazyElement(Component: ComponentType) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginScreen /> },
  {
    path: '/watch/:itemId',
    element: <RequireAuth>{lazyElement(PlayerScreen)}</RequireAuth>,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'library/:libraryId', element: lazyElement(LibraryScreen) },
      { path: 'item/:id', element: lazyElement(ItemDetailScreen) },
      { path: 'search', element: lazyElement(SearchScreen) },
      { path: 'history', element: lazyElement(HistoryScreen) },
      { path: 'settings', element: lazyElement(SettingsScreen) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
