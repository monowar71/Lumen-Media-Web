import { useParams } from 'react-router-dom';
import { useItem } from '@/api/queries';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/StateViews';
import { MovieDetailView } from './MovieDetailView';
import { SeriesDetailView } from './SeriesDetailView';

export function ItemDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useItem(id);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return data.kind === 'Series' ? (
    <SeriesDetailView series={data} />
  ) : (
    <MovieDetailView movie={data} />
  );
}
