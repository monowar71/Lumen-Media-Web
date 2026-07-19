import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLibraries } from '@/api/queries';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function NavBar() {
  const user = useAuthStore((s) => s.user);
  const { data: libraries } = useLibraries();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      isActive ? 'bg-surface-2 text-text' : 'text-muted hover:text-text',
    );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-black">▶</span>
          <span className="hidden sm:inline">FreePlex</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          {libraries?.map((lib) => (
            <NavLink key={lib.id} to={`/library/${lib.id}`} className={linkClass}>
              {lib.name}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden w-56 md:block">
          <Input
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </form>

        <div className="flex items-center gap-2 md:ml-0 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden"
            aria-label="Open search"
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((v) => !v)}
          >
            🔍
          </Button>
          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
          <span className="hidden text-sm text-muted lg:inline">{user?.username}</span>
          <Button size="sm" variant="secondary" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </div>

      {mobileSearchOpen && (
        <form onSubmit={onSearch} className="border-t border-border px-4 py-2 md:hidden">
          <Input
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            autoFocus
          />
        </form>
      )}
    </header>
  );
}
