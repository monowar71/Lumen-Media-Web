import { useState } from 'react';
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
      <h2 className="mb-1 text-lg font-semibold">Users</h2>
      <p className="mb-4 text-sm text-muted">Create and manage accounts (admin only).</p>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
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
                if (!window.confirm(`Delete user “${u.username}”?`)) return;
                remove.mutate(u.id, {
                  onError: (err) => setError(toErrorMessage(err)),
                  onSuccess: () => setMessage(`Deleted ${u.username}`),
                });
              }}
            >
              Delete
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
                setMessage('User created');
              },
              onError: (err) => setError(toErrorMessage(err)),
            },
          );
        }}
      >
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
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
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
        <Button type="submit" disabled={create.isPending}>
          Add user
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
  const { data, isLoading } = useServerSettings();
  const save = useSaveServerSettings();
  const [draft, setDraft] = useState<ServerSettingsDto | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = draft ?? data;

  if (isLoading || !settings) {
    return (
      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Server settings</h2>
        <p className="text-sm text-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">Server settings</h2>
      <p className="mb-4 text-sm text-muted">Transcoding limits and import watcher.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Hardware accel</span>
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
          <span className="text-muted">Max concurrent sessions</span>
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
          <span className="text-muted">Default remote cap (kbps)</span>
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
          <span>Watch downloads folder</span>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={() => {
            setError(null);
            save.mutate(settings, {
              onSuccess: () => {
                setDraft(null);
                setMessage('Server settings saved');
              },
              onError: (err) => setError(toErrorMessage(err)),
            });
          }}
          disabled={save.isPending}
        >
          Save server settings
        </Button>
        {message && <span className="text-sm text-accent">{message}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </section>
  );
}

export function AdminJobsSection() {
  const { data: jobs, isLoading } = useJobs();
  const cancel = useCancelJob();
  const { data: imports } = useImports();

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">Jobs</h2>
      <p className="mb-4 text-sm text-muted">Background scans and metadata tasks.</p>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
        {(jobs?.items ?? []).length === 0 && !isLoading && (
          <li className="px-4 py-3 text-sm text-muted">No jobs yet.</li>
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
                Cancel
              </Button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 text-sm font-semibold">Imports</h3>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {(imports?.items ?? []).length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">No pending imports.</li>
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
