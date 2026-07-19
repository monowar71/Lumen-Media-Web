import { useHome } from '@/api/queries';
import { MediaRow } from '@/components/MediaRow';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/StateViews';
import { useTranslation } from 'react-i18next';

export function HomeScreen() {
  const { t } = useTranslation('common');
  const { data, isLoading, isError, error, refetch } = useHome();

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const sections = data?.sections.filter((s) => s.items.length > 0) ?? [];
  if (sections.length === 0) {
    return <EmptyState title={t('home.emptyTitle')}>{t('home.emptyBody')}</EmptyState>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('home.title')}</h1>
      {sections.map((section) => (
        <MediaRow key={section.id} title={section.title} items={section.items} />
      ))}
    </div>
  );
}
