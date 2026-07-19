import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayerStore } from '@/stores/playerStore';
import {
  useCreateLibrary,
  useDeleteLibrary,
  useLibraries,
  useScanLibrary,
} from '@/api/queries';
import { toErrorMessage } from '@/api/http';
import type { LibraryType, PlaybackMode } from '@/api/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  AdminJobsSection,
  AdminServerSettingsSection,
  AdminUsersSection,
} from './AdminSections';
import { rewriteLoopbackBaseUrlForPage } from '@/lib/apiBaseUrl';
import type { AppLocale } from '@/i18n';

function kbpsToMbpsLabel(kbps: number, noLimit: string): string {
  if (kbps <= 0) return noLimit;
  return `${(kbps / 1000).toFixed(1)} Mbps`;
}

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  const {
    baseUrl,
    locale,
    lanCapKbps,
    externalCapKbps,
    setBaseUrl,
    setLocale,
    setLanCap,
    setExternalCap,
  } = useSettingsStore();

  const [server, setServer] = useState(baseUrl);
  const [lan, setLan] = useState(String(lanCapKbps));
  const [external, setExternal] = useState(String(externalCapKbps));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = rewriteLoopbackBaseUrlForPage(baseUrl, window.location.hostname);
    if (next !== baseUrl) setBaseUrl(next);
    setServer(next);
  }, [baseUrl, setBaseUrl]);

  const save = () => {
    setBaseUrl(server);
    setLanCap(Number(lan) || 0);
    setExternalCap(Number(external) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      {user?.role === 'Admin' && <LibrariesSection />}
      {user?.role === 'Admin' && <AdminUsersSection />}
      {user?.role === 'Admin' && <AdminServerSettingsSection />}
      {user?.role === 'Admin' && <AdminJobsSection />}

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">{t('language.title')}</h2>
        <p className="mb-4 text-sm text-muted">{t('language.description')}</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('language.label')}</span>
          <select
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value as AppLocale)}
          >
            <option value="ru">{t('language.ru')}</option>
            <option value="en">{t('language.en')}</option>
          </select>
        </label>
      </section>

      <PlayerPrefsSection />

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">{t('server.title')}</h2>
        <p className="mb-4 text-sm text-muted">{t('server.description')}</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('server.url')}</span>
          <Input
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="http://localhost:8096"
          />
        </label>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">{t('streaming.title')}</h2>
        <p className="mb-4 text-sm text-muted">{t('streaming.description')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">
              {t('streaming.lanCap', {
                label: kbpsToMbpsLabel(Number(lan) || 0, t('streaming.noLimit')),
              })}
            </span>
            <Input
              type="number"
              min={0}
              step={500}
              value={lan}
              onChange={(e) => setLan(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">
              {t('streaming.externalCap', {
                label: kbpsToMbpsLabel(Number(external) || 0, t('streaming.noLimit')),
              })}
            </span>
            <Input
              type="number"
              min={0}
              step={500}
              value={external}
              onChange={(e) => setExternal(e.target.value)}
            />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save}>{t('save')}</Button>
        {saved && <span className="text-sm text-accent">{t('saved')}</span>}
      </div>
    </div>
  );
}

function PlayerPrefsSection() {
  const { t } = useTranslation('settings');
  const preferredMode = usePlayerStore((s) => s.preferredMode);
  const setPreferredMode = usePlayerStore((s) => s.setPreferredMode);

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">{t('player.title')}</h2>
      <p className="mb-4 text-sm text-muted">{t('player.description')}</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">{t('player.preferredMode')}</span>
        <select
          className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm"
          value={preferredMode}
          onChange={(e) => setPreferredMode(e.target.value as PlaybackMode)}
        >
          <option value="auto">{t('player.auto')}</option>
          <option value="manual">{t('player.manual')}</option>
        </select>
      </label>
    </section>
  );
}

function LibrariesSection() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { data: libraries, isLoading } = useLibraries();
  const create = useCreateLibrary();
  const scan = useScanLibrary();
  const remove = useDeleteLibrary();

  const [name, setName] = useState('');
  const [type, setType] = useState<LibraryType>('Movies');
  const [path, setPath] = useState('/media/movies');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmedName = name.trim();
    const trimmedPath = path.trim();
    if (!trimmedName || !trimmedPath) {
      setError(t('libraries.namePathRequired'));
      return;
    }
    try {
      const lib = await create.mutateAsync({
        name: trimmedName,
        type,
        paths: [trimmedPath],
      });
      setMessage(t('libraries.createdScanning', { name: lib.name }));
      setName('');
      await scan.mutateAsync(lib.id);
      setMessage(t('libraries.createdScanned', { name: lib.name }));
    } catch (err) {
      setError(toErrorMessage(err, t('libraries.createFailed')));
    }
  };

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">{t('libraries.title')}</h2>
      <p className="mb-4 text-sm text-muted">{t('libraries.description')}</p>

      {isLoading && <p className="mb-4 text-sm text-muted">{t('common:state.loading')}</p>}

      <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
        {(libraries ?? []).length === 0 && !isLoading && (
          <li className="px-4 py-3 text-sm text-muted">{t('libraries.empty')}</li>
        )}
        {(libraries ?? []).map((lib) => (
          <li key={lib.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link to={`/library/${lib.id}`} className="font-medium hover:text-accent">
                {lib.name}
              </Link>
              <p className="truncate text-xs text-muted">
                {i18n.t(`common:mediaTypes.${lib.type}`, { defaultValue: lib.type })} ·{' '}
                {(lib.paths ?? []).join(', ') || t('libraries.noPaths')} ·{' '}
                {t('libraries.items', { count: lib.itemCount })}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={scan.isPending}
              onClick={() => {
                setError(null);
                scan.mutate(lib.id, {
                  onSuccess: () => setMessage(t('libraries.scanStarted', { name: lib.name })),
                  onError: (err) => setError(toErrorMessage(err, t('libraries.scanFailed'))),
                });
              }}
            >
              {t('libraries.scan')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm(t('libraries.confirmDelete', { name: lib.name }))) return;
                setError(null);
                remove.mutate(lib.id, {
                  onSuccess: () => setMessage(t('libraries.deleted', { name: lib.name })),
                  onError: (err) => setError(toErrorMessage(err, t('libraries.deleteFailed'))),
                });
              }}
            >
              {t('libraries.delete')}
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void onCreate(e)} className="grid gap-3">
        <h3 className="text-sm font-semibold">{t('libraries.addTitle')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('libraries.name')}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Movies"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('libraries.type')}</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-accent focus:outline-none"
              value={type}
              onChange={(e) => {
                const next = e.target.value as LibraryType;
                setType(next);
                setPath(next === 'Movies' ? '/media/movies' : '/media/tv');
              }}
            >
              <option value="Movies">{t('common:mediaTypes.Movies')}</option>
              <option value="Series">{t('common:mediaTypes.Series')}</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('libraries.path')}</span>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/media/movies"
            required
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={create.isPending || scan.isPending}>
            {create.isPending ? t('libraries.creating') : t('libraries.createScan')}
          </Button>
          {message && <span className="text-sm text-accent">{message}</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>
    </section>
  );
}
