import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

function kbpsToMbpsLabel(kbps: number): string {
  if (kbps <= 0) return 'No limit';
  return `${(kbps / 1000).toFixed(1)} Mbps`;
}

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const { baseUrl, lanCapKbps, externalCapKbps, setBaseUrl, setLanCap, setExternalCap } =
    useSettingsStore();

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
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {user?.role === 'Admin' && <LibrariesSection />}
      {user?.role === 'Admin' && <AdminUsersSection />}
      {user?.role === 'Admin' && <AdminServerSettingsSection />}
      {user?.role === 'Admin' && <AdminJobsSection />}

      <PlayerPrefsSection />

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">Server</h2>
        <p className="mb-4 text-sm text-muted">The base URL of your FreePlex server.</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Server URL</span>
          <Input
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="http://localhost:8096"
          />
        </label>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">Streaming quality</h2>
        <p className="mb-4 text-sm text-muted">
          Separate bitrate caps for local and external/mobile connections. The active cap is sent to
          the server as <code>maxBitrateKbps</code>. Use 0 for no limit.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Local network cap (kbps) — {kbpsToMbpsLabel(Number(lan) || 0)}</span>
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
              External/mobile cap (kbps) — {kbpsToMbpsLabel(Number(external) || 0)}
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
        <Button onClick={save}>Save settings</Button>
        {saved && <span className="text-sm text-accent">Saved ✓</span>}
      </div>
    </div>
  );
}

function PlayerPrefsSection() {
  const preferredMode = usePlayerStore((s) => s.preferredMode);
  const setPreferredMode = usePlayerStore((s) => s.setPreferredMode);

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">Player</h2>
      <p className="mb-4 text-sm text-muted">Default quality mode when starting playback.</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Preferred mode</span>
        <select
          className="h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm"
          value={preferredMode}
          onChange={(e) => setPreferredMode(e.target.value as PlaybackMode)}
        >
          <option value="auto">Auto (ABR)</option>
          <option value="manual">Manual (Original)</option>
        </select>
      </label>
    </section>
  );
}

function LibrariesSection() {
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
      setError('Name and path are required');
      return;
    }
    try {
      const lib = await create.mutateAsync({
        name: trimmedName,
        type,
        paths: [trimmedPath],
      });
      setMessage(`Created “${lib.name}”. Scanning…`);
      setName('');
      await scan.mutateAsync(lib.id);
      setMessage(`Created “${lib.name}” and started a scan.`);
    } catch (err) {
      setError(toErrorMessage(err, 'Could not create library'));
    }
  };

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-semibold">Libraries</h2>
      <p className="mb-4 text-sm text-muted">
        Paths are inside the server container (e.g. <code>/media/movies</code>,{' '}
        <code>/media/tv</code>). Host folder: <code>./media</code>.
      </p>

      {isLoading && <p className="mb-4 text-sm text-muted">Loading…</p>}

      <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
        {(libraries ?? []).length === 0 && !isLoading && (
          <li className="px-4 py-3 text-sm text-muted">No libraries yet.</li>
        )}
        {(libraries ?? []).map((lib) => (
          <li key={lib.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link to={`/library/${lib.id}`} className="font-medium hover:text-accent">
                {lib.name}
              </Link>
              <p className="truncate text-xs text-muted">
                {lib.type} · {(lib.paths ?? []).join(', ') || 'no paths'} · {lib.itemCount} items
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={scan.isPending}
              onClick={() => {
                setError(null);
                scan.mutate(lib.id, {
                  onSuccess: () => setMessage(`Scan started for “${lib.name}”.`),
                  onError: (err) => setError(toErrorMessage(err, 'Scan failed')),
                });
              }}
            >
              Scan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm(`Delete library “${lib.name}”?`)) return;
                setError(null);
                remove.mutate(lib.id, {
                  onSuccess: () => setMessage(`Deleted “${lib.name}”.`),
                  onError: (err) => setError(toErrorMessage(err, 'Delete failed')),
                });
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void onCreate(e)} className="grid gap-3">
        <h3 className="text-sm font-semibold">Add library</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Movies"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Type</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-accent focus:outline-none"
              value={type}
              onChange={(e) => {
                const next = e.target.value as LibraryType;
                setType(next);
                setPath(next === 'Movies' ? '/media/movies' : '/media/tv');
              }}
            >
              <option value="Movies">Movies</option>
              <option value="Series">Series</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Folder path (inside container)</span>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/media/movies"
            required
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={create.isPending || scan.isPending}>
            {create.isPending ? 'Creating…' : 'Create & scan'}
          </Button>
          {message && <span className="text-sm text-accent">{message}</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>
    </section>
  );
}
