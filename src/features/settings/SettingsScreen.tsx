import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { IconActivity, IconDevices } from '@/components/AppIcons';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'playback' | 'libraries' | 'activity' | 'devices' | 'admin';

function kbpsToMbpsLabel(kbps: number, noLimit: string): string {
  if (kbps <= 0) return noLimit;
  return `${(kbps / 1000).toFixed(1)} Mbps`;
}

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';
  const [params, setParams] = useSearchParams();

  const tab = useMemo<SettingsTab>(() => {
    const raw = params.get('tab') ?? 'general';
    if (raw === 'libraries' || raw === 'activity' || raw === 'devices' || raw === 'playback') {
      return raw;
    }
    if (raw === 'admin' && isAdmin) return 'admin';
    return 'general';
  }, [params, isAdmin]);

  const setTab = (next: SettingsTab) => {
    const p = new URLSearchParams(params);
    if (next === 'general') p.delete('tab');
    else p.set('tab', next);
    setParams(p, { replace: true });
  };

  const tabs: { id: SettingsTab; label: string; adminOnly?: boolean }[] = [
    { id: 'general', label: t('tabs.general') },
    { id: 'playback', label: t('tabs.playback') },
    { id: 'libraries', label: t('tabs.libraries'), adminOnly: true },
    { id: 'activity', label: t('tabs.activity') },
    { id: 'devices', label: t('tabs.devices') },
    { id: 'admin', label: t('tabs.admin'), adminOnly: true },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-display mb-6 text-2xl font-extrabold sm:text-3xl">{t('title')}</h1>

      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs
          .filter((tabItem) => !tabItem.adminOnly || isAdmin)
          .map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === tabItem.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {tabItem.label}
            </button>
          ))}
      </div>

      {tab === 'general' && <GeneralSection />}
      {tab === 'playback' && <PlaybackSection />}
      {tab === 'libraries' && isAdmin && <LibrariesSection />}
      {tab === 'activity' && <ActivityMockSection />}
      {tab === 'devices' && <DevicesMockSection />}
      {tab === 'admin' && isAdmin && (
        <>
          <AdminUsersSection />
          <AdminServerSettingsSection />
          <AdminJobsSection />
        </>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-muted">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}

function GeneralSection() {
  const { t } = useTranslation('settings');
  const { baseUrl, locale, setBaseUrl, setLocale } = useSettingsStore();
  const [server, setServer] = useState(baseUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = rewriteLoopbackBaseUrlForPage(baseUrl, window.location.hostname);
    if (next !== baseUrl) setBaseUrl(next);
    setServer(next);
  }, [baseUrl, setBaseUrl]);

  const save = () => {
    setBaseUrl(server);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SectionCard title={t('language.title')} description={t('language.description')}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('language.label')}</span>
          <select
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface-2 px-3 text-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value as AppLocale)}
          >
            <option value="ru">{t('language.ru')}</option>
            <option value="en">{t('language.en')}</option>
          </select>
        </label>
      </SectionCard>

      <SectionCard title={t('server.title')} description={t('server.description')}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('server.url')}</span>
          <Input
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="http://localhost:8096"
          />
        </label>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save}>{t('save')}</Button>
          {saved && <span className="text-sm text-accent">{t('saved')}</span>}
        </div>
      </SectionCard>
    </>
  );
}

function PlaybackSection() {
  const { t } = useTranslation('settings');
  const preferredMode = usePlayerStore((s) => s.preferredMode);
  const setPreferredMode = usePlayerStore((s) => s.setPreferredMode);
  const { lanCapKbps, externalCapKbps, setLanCap, setExternalCap } = useSettingsStore();
  const [lan, setLan] = useState(String(lanCapKbps));
  const [external, setExternal] = useState(String(externalCapKbps));
  const [saved, setSaved] = useState(false);

  const save = () => {
    setLanCap(Number(lan) || 0);
    setExternalCap(Number(external) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SectionCard title={t('player.title')} description={t('player.description')}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('player.preferredMode')}</span>
          <select
            className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface-2 px-3 text-sm"
            value={preferredMode}
            onChange={(e) => setPreferredMode(e.target.value as PlaybackMode)}
          >
            <option value="auto">{t('player.auto')}</option>
            <option value="manual">{t('player.manual')}</option>
          </select>
        </label>
      </SectionCard>

      <SectionCard title={t('streaming.title')} description={t('streaming.description')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">
              {t('streaming.lanCap', {
                label: kbpsToMbpsLabel(Number(lan) || 0, t('streaming.noLimit')),
              })}
            </span>
            <Input type="number" min={0} step={500} value={lan} onChange={(e) => setLan(e.target.value)} />
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
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save}>{t('save')}</Button>
          {saved && <span className="text-sm text-accent">{t('saved')}</span>}
        </div>
      </SectionCard>
    </>
  );
}

/** Mock “now playing / recent activity” management surface (Plex-like). */
function ActivityMockSection() {
  const { t } = useTranslation('settings');
  return (
    <SectionCard title={t('activity.title')} description={t('activity.description')}>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2/40 px-6 py-10 text-center">
        <IconActivity size={28} className="text-muted" />
        <p className="text-sm font-medium">{t('activity.empty')}</p>
        <p className="max-w-sm text-xs text-muted">{t('activity.hint')}</p>
      </div>
    </SectionCard>
  );
}

/** Mock authorized devices list. */
function DevicesMockSection() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  return (
    <SectionCard title={t('devices.title')} description={t('devices.description')}>
      <ul className="divide-y divide-border rounded-xl border border-border">
        <li className="flex items-center gap-3 px-4 py-3">
          <IconDevices size={20} className="text-accent" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t('devices.thisBrowser')}</p>
            <p className="truncate text-xs text-muted">
              {user?.username} · {t('devices.online')}
            </p>
          </div>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
            {t('devices.current')}
          </span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted">{t('devices.comingSoon')}</p>
    </SectionCard>
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
  const [path, setPath] = useState('/media');
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
    <SectionCard title={t('libraries.title')} description={t('libraries.description')}>
      {isLoading && <p className="mb-4 text-sm text-muted">{t('common:state.loading')}</p>}

      <ul className="mb-6 divide-y divide-border rounded-xl border border-border">
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Movies" required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('libraries.type')}</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent focus:outline-none"
              value={type}
              onChange={(e) => setType(e.target.value as LibraryType)}
            >
              <option value="Movies">{t('common:mediaTypes.Movies')}</option>
              <option value="Series">{t('common:mediaTypes.Series')}</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('libraries.path')}</span>
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/media" required />
          <span className="text-xs text-muted">{t('libraries.pathHint')}</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={create.isPending || scan.isPending}>
            {create.isPending ? t('libraries.creating') : t('libraries.createScan')}
          </Button>
          {message && <span className="text-sm text-accent">{message}</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>
    </SectionCard>
  );
}
