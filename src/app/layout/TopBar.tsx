import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { IconMenu, IconSearch, IconUser } from '@/components/AppIcons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-bg/80 px-3 backdrop-blur-xl sm:px-5 lg:h-16">
      <button
        type="button"
        className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text lg:hidden"
        onClick={onMenuClick}
        aria-label={t('nav.openMenu')}
      >
        <IconMenu size={22} />
      </button>

      <form onSubmit={onSearch} className="relative ml-auto min-w-0 flex-1 max-w-md lg:ml-0">
        <IconSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          type="search"
          placeholder={t('nav.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('nav.search')}
          className="h-10 border-transparent bg-surface-2/80 pl-9 focus:border-accent"
        />
      </form>

      <div className="hidden items-center gap-2 sm:flex">
        <div className="flex items-center gap-2 rounded-full bg-surface-2 px-2.5 py-1.5 text-sm text-muted">
          <IconUser size={16} />
          <span className="max-w-[8rem] truncate">{user?.username}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => void logout()}>
          {t('nav.signOut')}
        </Button>
      </div>
    </header>
  );
}
