import { useMemo } from 'react';
import { useHome } from '@/api/queries';
import { MediaRow } from '@/components/MediaRow';
import { HeroBanner } from '@/components/HeroBanner';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/StateViews';
import { useTranslation } from 'react-i18next';

export function HomeScreen() {
  const { t } = useTranslation('common');
  const { data, isLoading, isError, error, refetch } = useHome();

  const sections = useMemo(
    () => data?.sections.filter((s) => s.items.length > 0) ?? [],
    [data],
  );

  const heroItem = useMemo(() => {
    for (const section of sections) {
      const withArt = section.items.find((i) => i.artwork.backdrop || i.artwork.poster);
      if (withArt) return withArt;
    }
    return sections[0]?.items[0];
  }, [sections]);

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  if (sections.length === 0) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title={t('home.emptyTitle')}>{t('home.emptyBody')}</EmptyState>
      </div>
    );
  }

  return (
    <div>
      {heroItem && <HeroBanner item={heroItem} />}
      <div className={heroItem ? '' : 'pt-6'}>
        {sections.map((section) => (
          <MediaRow key={section.id} title={section.title} items={section.items} />
        ))}
      </div>
    </div>
  );
}
