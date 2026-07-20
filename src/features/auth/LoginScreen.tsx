import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthActions } from './useAuthActions';
import * as api from '@/api/endpoints';
import { BrandMark } from '@/components/AppIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toErrorMessage } from '@/api/http';
import { rewriteLoopbackBaseUrlForPage } from '@/lib/apiBaseUrl';

interface LocationState {
  from?: string;
}

export function LoginScreen() {
  const { t } = useTranslation(['auth', 'common']);
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
  const [serverName, setServerName] = useState('LumenMedia');
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
      <div className="flex min-h-screen items-center justify-center text-muted">
        {t('common:state.restoringSession')}
      </div>
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
          { username, password, serverName: serverName.trim() || 'LumenMedia' },
          server,
        );
        setNeedsSetup(false);
      }
      await login(username, password);
      const dest = (location.state as LocationState | null)?.from ?? '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(toErrorMessage(err, needsSetup ? t('setupFailed') : t('loginFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--color-accent) 35%, transparent), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent)',
        }}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-surface/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={44} className="shadow-[0_0_32px_var(--color-accent-soft)]" />
          <div>
            <h1 className="text-display text-xl font-extrabold">{t('common:brand')}</h1>
            <p className="text-sm text-muted">
              {needsSetup ? t('subtitleSetup') : t('subtitleLogin')}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('serverUrl')}</span>
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
            <span className="text-xs text-muted">{t('serverUrlHint')}</span>
          </label>
          {needsSetup && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{t('serverName')}</span>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="LumenMedia"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('username')}</span>
            <Input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t('password')}</span>
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
                ? t('settingUp')
                : t('signingIn')
              : needsSetup
                ? t('createAdmin')
                : t('signIn')}
          </Button>
        </form>
      </div>
    </div>
  );
}
