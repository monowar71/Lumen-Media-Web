import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toErrorMessage } from '@/api/http';
import { Button } from './ui/Button';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-lg font-semibold">{t('state.somethingWrong')}</p>
      <p className="max-w-md text-sm text-muted">{toErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('state.tryAgain')}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <p className="max-w-md text-sm text-muted">{children}</p>}
    </div>
  );
}
