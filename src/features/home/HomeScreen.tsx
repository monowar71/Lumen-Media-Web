import { useHome } from '@/api/queries';
import { MediaRow } from '@/components/MediaRow';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/StateViews';

export function HomeScreen() {
  const { data, isLoading, isError, error, refetch } = useHome();

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const sections = data?.sections.filter((s) => s.items.length > 0) ?? [];
  if (sections.length === 0) {
    return <EmptyState title="Nothing here yet">Add media to your libraries to get started.</EmptyState>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Home</h1>
      {sections.map((section) => (
        <MediaRow key={section.id} title={section.title} items={section.items} />
      ))}
    </div>
  );
}
