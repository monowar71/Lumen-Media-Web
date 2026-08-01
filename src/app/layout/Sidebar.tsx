import { NavLink, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLibraries } from '@/api/queries';
import {
  BrandMark,
  IconActivity,
  IconClose,
  IconDevices,
  IconHistory,
  IconHome,
  IconLibrary,
  IconMovies,
  IconSettings,
  IconTv,
} from '@/components/AppIcons';
import { cn } from '@/lib/utils';
import type { LibraryType } from '@/api/types';

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

function navClass(active: boolean) {
  return cn(
    linkBase,
    active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
  );
}

function LibraryIcon({ type }: { type: LibraryType }) {
  return type === 'Series' ? <IconTv size={18} /> : <IconMovies size={18} />;
}

/** Settings tabs share pathname `/settings`; only active while on that route. */
function settingsTabActive(
  pathname: string,
  searchParams: URLSearchParams,
  tab: string | null,
): boolean {
  if (!pathname.startsWith('/settings')) return false;
  const current = searchParams.get('tab');
  if (tab === null) {
    // Default "Settings" — active for general settings tabs, not activity/devices/libraries.
    return current === null || current === 'general' || current === 'playback' || current === 'admin';
  }
  return current === tab;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const { t } = useTranslation('common');
  const { data: libraries } = useLibraries();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(100%,var(--spacing-sidebar))] flex-col border-r border-border bg-surface/95 backdrop-blur-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-surface',
          open ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
        aria-label={t('nav.mainNav')}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4 lg:h-16">
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} className="shadow-[0_0_24px_var(--color-accent-soft)]" />
            <span className="text-display text-lg font-extrabold tracking-tight">{t('brand')}</span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text lg:hidden"
            onClick={onClose}
            aria-label={t('nav.closeMenu')}
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
            {t('nav.browse')}
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink to="/" end className={({ isActive }) => navClass(isActive)} onClick={onClose}>
              <IconHome size={18} />
              {t('nav.home')}
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => navClass(isActive)} onClick={onClose}>
              <IconLibrary size={18} />
              {t('nav.search')}
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => navClass(isActive)} onClick={onClose}>
              <IconHistory size={18} />
              {t('nav.history')}
            </NavLink>
          </div>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
            {t('nav.libraries')}
          </p>
          <div className="flex flex-col gap-0.5">
            {(libraries ?? []).length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">{t('nav.noLibraries')}</p>
            )}
            {(libraries ?? []).map((lib) => (
              <NavLink
                key={lib.id}
                to={`/library/${lib.id}`}
                className={({ isActive }) => navClass(isActive)}
                onClick={onClose}
              >
                <LibraryIcon type={lib.type} />
                <span className="min-w-0 flex-1 truncate">{lib.name}</span>
                <span className="text-[11px] tabular-nums text-muted/70">{lib.itemCount}</span>
              </NavLink>
            ))}
          </div>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
            {t('nav.manage')}
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/settings?tab=activity"
              className={() => navClass(settingsTabActive(pathname, searchParams, 'activity'))}
              onClick={onClose}
            >
              <IconActivity size={18} />
              {t('nav.activity')}
            </NavLink>
            <NavLink
              to="/settings?tab=devices"
              className={() => navClass(settingsTabActive(pathname, searchParams, 'devices'))}
              onClick={onClose}
            >
              <IconDevices size={18} />
              {t('nav.devices')}
            </NavLink>
            <NavLink
              to="/settings"
              end
              className={() => navClass(settingsTabActive(pathname, searchParams, null))}
              onClick={onClose}
            >
              <IconSettings size={18} />
              {t('nav.settings')}
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
