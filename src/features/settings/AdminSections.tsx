import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCancelJob,
  useCreateUser,
  useDeleteUser,
  useImports,
  useJobs,
  useSaveServerSettings,
  useServerSettings,
  useUsers,
} from '@/api/queries';
import { toErrorMessage } from '@/api/http';
import type { ServerSettingsDto, UserRole } from '@/api/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function AdminUsersSection() {
  const { t } = useTranslation(['settings', 'common']);
  const { data: users, isLoading } = useUsers();
  const create = useCreateUser();
  const remove = useDeleteUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('User');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">{t('users.title')}</h2>
      <p className="mb-4 text-sm text-muted">{t('users.description')}</p>
      {isLoading && <p className="text-sm text-muted">{t('common:state.loading')}</p>}
      <ul className="mb-4 divide-y divide-border rounded-lg border border-border">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{u.username}</p>
              <p className="text-xs text-muted">{u.role}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending || u.role === 'Admin'}
              onClick={() => {
                if (!window.confirm(t('users.confirmDelete', { name: u.username }))) return;
                remove.mutate(u.id, {
                  onError: (err) => setError(toErrorMessage(err)),
                  onSuccess: () => setMessage(t('users.deleted', { name: u.username })),
                });
              }}
            >
              {t('users.delete')}
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          create.mutate(
            { username, password, role, allowTranscoding: true },
            {
              onSuccess: () => {
                setUsername('');
                setPassword('');
                setMessage(t('users.created'));
              },
              onError: (err) => setError(toErrorMessage(err)),
            },
          );
        }}
      >
        <Input
          placeholder={t('users.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder={t('users.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="User">{t('users.roleUser')}</option>
          <option value="Admin">{t('users.roleAdmin')}</option>
        </select>
        <Button type="submit" disabled={create.isPending}>
          {t('users.add')}
        </Button>
      </form>
      {message && <p className="mt-2 text-sm text-accent">{message}</p>}
      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export function AdminServerSettingsSection() {
  const { t } = useTranslation(['settings', 'common']);
  const { data, isLoading } = useServerSettings();
  const save = useSaveServerSettings();
  const [draft, setDraft] = useState<ServerSettingsDto | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = draft ?? data;

  if (isLoading || !settings) {
    return (
      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">{t('serverAdmin.title')}</h2>
        <p className="text-sm text-muted">{t('common:state.loading')}</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">{t('serverAdmin.title')}</h2>
      <p className="mb-4 text-sm text-muted">{t('serverAdmin.description')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.hardwareAccel')}</span>
          <Input
            value={settings.transcoding?.hardwareAccel ?? 'auto'}
            onChange={(e) =>
              setDraft({
                ...settings,
                transcoding: { ...settings.transcoding, hardwareAccel: e.target.value },
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.maxSessions')}</span>
          <Input
            type="number"
            min={1}
            value={String(settings.transcoding?.maxConcurrentSessions ?? 3)}
            onChange={(e) =>
              setDraft({
                ...settings,
                transcoding: {
                  ...settings.transcoding,
                  maxConcurrentSessions: Number(e.target.value) || 1,
                },
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.remoteCap')}</span>
          <Input
            type="number"
            min={0}
            value={String(settings.transcoding?.defaultRemoteCapKbps ?? 8000)}
            onChange={(e) =>
              setDraft({
                ...settings,
                transcoding: {
                  ...settings.transcoding,
                  defaultRemoteCapKbps: Number(e.target.value) || 0,
                },
              })
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.import?.watch)}
            onChange={(e) =>
              setDraft({
                ...settings,
                import: { ...settings.import, watch: e.target.checked },
              })
            }
          />
          <span>{t('serverAdmin.watchDownloads')}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.metadataLanguage')}</span>
          <Input
            value={settings.metadata?.language ?? 'ru-RU'}
            onChange={(e) =>
              setDraft({
                ...settings,
                metadata: { ...settings.metadata, language: e.target.value },
              })
            }
            placeholder="ru-RU"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.fallbackLanguage')}</span>
          <Input
            value={settings.metadata?.fallbackLanguage ?? 'en-US'}
            onChange={(e) =>
              setDraft({
                ...settings,
                metadata: { ...settings.metadata, fallbackLanguage: e.target.value },
              })
            }
            placeholder="en-US"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">{t('serverAdmin.metadataHint')}</p>

      <h3 className="mb-2 mt-6 text-sm font-semibold">{t('serverAdmin.providersTitle')}</h3>
      <p className="mb-3 text-xs text-muted">{t('serverAdmin.providersHint')}</p>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <ProviderBadge
          label="TMDB"
          configured={Boolean(settings.metadata?.tmdbConfigured)}
          configuredLabel={t('serverAdmin.configured')}
          missingLabel={t('serverAdmin.notConfigured')}
        />
        <ProviderBadge
          label="TVMaze"
          configured
          free
          configuredLabel={t('serverAdmin.configured')}
          missingLabel={t('serverAdmin.notConfigured')}
          freeLabel={t('serverAdmin.freeNoKey')}
        />
        <ProviderBadge
          label="TVDB"
          configured={Boolean(settings.metadata?.tvdbConfigured)}
          configuredLabel={t('serverAdmin.configured')}
          missingLabel={t('serverAdmin.notConfigured')}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-muted">{t('serverAdmin.tmdbApiKey')}</span>
          <Input
            type="password"
            autoComplete="off"
            placeholder={
              settings.metadata?.tmdbConfigured
                ? t('serverAdmin.keyConfiguredPlaceholder')
                : t('serverAdmin.tmdbApiKeyPlaceholder')
            }
            value={settings.metadata?.tmdbApiKey ?? ''}
            onChange={(e) =>
              setDraft({
                ...settings,
                metadata: { ...settings.metadata, tmdbApiKey: e.target.value },
              })
            }
          />
          <a
            className="text-xs text-accent hover:underline"
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
          >
            {t('serverAdmin.tmdbKeyHelp')}
          </a>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.tvdbApiKey')}</span>
          <Input
            type="password"
            autoComplete="off"
            placeholder={
              settings.metadata?.tvdbConfigured
                ? t('serverAdmin.keyConfiguredPlaceholder')
                : t('serverAdmin.tvdbApiKeyPlaceholder')
            }
            value={settings.metadata?.tvdbApiKey ?? ''}
            onChange={(e) =>
              setDraft({
                ...settings,
                metadata: { ...settings.metadata, tvdbApiKey: e.target.value },
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{t('serverAdmin.tvdbPin')}</span>
          <Input
            type="password"
            autoComplete="off"
            placeholder={t('serverAdmin.tvdbPinPlaceholder')}
            value={settings.metadata?.tvdbPin ?? ''}
            onChange={(e) =>
              setDraft({
                ...settings,
                metadata: { ...settings.metadata, tvdbPin: e.target.value },
              })
            }
          />
          <a
            className="text-xs text-accent hover:underline"
            href="https://thetvdb.com/api-information"
            target="_blank"
            rel="noreferrer"
          >
            {t('serverAdmin.tvdbKeyHelp')}
          </a>
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">{t('serverAdmin.keysHint')}</p>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={() => {
            setError(null);
            // Only send key fields when the admin typed something (avoid wiping via empty draft).
            const meta = settings.metadata ?? {};
            const payload: ServerSettingsDto = {
              ...settings,
              metadata: {
                ...meta,
                tmdbApiKey: meta.tmdbApiKey?.trim() ? meta.tmdbApiKey : undefined,
                tvdbApiKey: meta.tvdbApiKey?.trim() ? meta.tvdbApiKey : undefined,
                tvdbPin: meta.tvdbPin?.trim() ? meta.tvdbPin : undefined,
              },
            };
            save.mutate(payload, {
              onSuccess: () => {
                setDraft(null);
                setMessage(t('serverAdmin.saved'));
              },
              onError: (err) => setError(toErrorMessage(err)),
            });
          }}
          disabled={save.isPending}
        >
          {t('serverAdmin.save')}
        </Button>
        {message && <span className="text-sm text-accent">{message}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </section>
  );
}

function ProviderBadge({
  label,
  configured,
  free,
  configuredLabel,
  missingLabel,
  freeLabel,
}: {
  label: string;
  configured: boolean;
  free?: boolean;
  configuredLabel: string;
  missingLabel: string;
  freeLabel?: string;
}) {
  const status = free ? (freeLabel ?? configuredLabel) : configured ? configuredLabel : missingLabel;
  const tone = free || configured ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted';
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${tone}`}>
      {label}: {status}
    </span>
  );
}

export function AdminJobsSection() {
  const { t } = useTranslation(['settings', 'common']);
  const { data: jobs, isLoading } = useJobs();
  const cancel = useCancelJob();
  const { data: imports } = useImports();

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">{t('jobs.title')}</h2>
      <p className="mb-4 text-sm text-muted">{t('jobs.description')}</p>
      {isLoading && <p className="text-sm text-muted">{t('common:state.loading')}</p>}
      <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
        {(jobs?.items ?? []).length === 0 && !isLoading && (
          <li className="px-4 py-3 text-sm text-muted">{t('jobs.empty')}</li>
        )}
        {(jobs?.items ?? []).map((job) => (
          <li key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {job.type} · {job.state}
              </p>
              <p className="text-xs text-muted">
                {Math.round(Number(job.progress) * 100)}%
                {job.error ? ` · ${job.error}` : ''}
              </p>
            </div>
            {(job.state === 'Queued' || job.state === 'Running') && (
              <Button size="sm" variant="secondary" onClick={() => cancel.mutate(job.id)}>
                {t('jobs.cancel')}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 text-sm font-semibold">{t('jobs.imports')}</h3>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {(imports?.items ?? []).length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">{t('jobs.importsEmpty')}</li>
        )}
        {(imports?.items ?? []).map((imp) => (
          <li key={String(imp.id)} className="px-4 py-3 text-sm">
            <p className="font-medium truncate">{imp.sourcePath}</p>
            <p className="text-xs text-muted">{String(imp.status)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
