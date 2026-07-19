import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconHome, IconLibrary, IconSearch, IconSettings } from '@/components/AppIcons';
import { cn } from '@/lib/utils';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
    isActive ? 'text-accent' : 'text-muted',
  );

/** Mobile bottom navigation — Plex-style thumb-friendly controls. */
export function MobileBottomNav() {
  const { t } = useTranslation('common');

  return (
    <nav
      className="safe-pb fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden"
      aria-label={t('nav.mainNav')}
    >
      <NavLink to="/" end className={itemClass}>
        <IconHome size={20} />
        {t('nav.home')}
      </NavLink>
      <NavLink to="/search" className={itemClass}>
        <IconSearch size={20} />
        {t('nav.search')}
      </NavLink>
      <NavLink to="/settings?tab=libraries" className={itemClass}>
        <IconLibrary size={20} />
        {t('nav.libraries')}
      </NavLink>
      <NavLink to="/settings" end className={itemClass}>
        <IconSettings size={20} />
        {t('nav.settings')}
      </NavLink>
    </nav>
  );
}
