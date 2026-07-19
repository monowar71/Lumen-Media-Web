import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthActions } from './useAuthActions';
import * as api from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/api/http';
import { rewriteLoopbackBaseUrlForPage } from '@/lib/apiBaseUrl';

interface LocationState {
  from?: string;
}

export function LoginScreen() {
  const status = useAuthStore((s) => s.status);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const setBaseUrl = useSettingsStore((s) => s.setBaseUrl);
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();

  const [server, setServer] = useState(() =>
    rewriteLoopbackBaseUrlForPage(baseUrl, window.location.hostname),
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('FreePlex');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Opening the UI via LAN IP with a persisted localhost API URL would call the
  // client device itself — rewrite once and keep settings in sync.
  useEffect(() => {
    const next = rewriteLoopbackBaseUrlForPage(
      useSettingsStore.getState().baseUrl,
      window.location.hostname,
    );
    setBaseUrl(next);
    setServer(next);
  }, [setBaseUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const info = await api.getServerInfo(server);
        if (!cancelled) setNeedsSetup(!info.setupCompleted);
      } catch {
        if (!cancelled) setNeedsSetup(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [server]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Restoring session…</div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setBaseUrl(server);
    try {
      if (needsSetup) {
        await api.setup(
          { username, password, serverName: serverName.trim() || 'FreePlex' },
          server,
        );
        setNeedsSetup(false);
      }
      await login(username, password);
      const dest = (location.state as LocationState | null)?.from ?? '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(toErrorMessage(err, needsSetup ? 'Setup failed' : 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-lg text-black">
            ▶
          </span>
          <div>
            <h1 className="text-xl font-bold">FreePlex</h1>
            <p className="text-sm text-muted">
              {needsSetup ? 'Create the first admin account' : 'Sign in to your server'}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Server URL</span>
            <Input
              type="url"
              inputMode="url"
              placeholder={rewriteLoopbackBaseUrlForPage(
                'http://localhost:8096',
                window.location.hostname,
              )}
              value={server}
              onChange={(e) => setServer(e.target.value)}
              required
            />
            <span className="text-xs text-muted">
              On other devices open the web UI at this PC&apos;s LAN address (port 5173). Server URL
              is set automatically to port 8096 on the same host.
            </span>
          </label>
          {needsSetup && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Server name</span>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="FreePlex"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Username</span>
            <Input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Password</span>
            <Input
              type="password"
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={needsSetup ? 6 : undefined}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting
              ? needsSetup
                ? 'Setting up…'
                : 'Signing in…'
              : needsSetup
                ? 'Create admin & sign in'
                : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
