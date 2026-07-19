import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent',
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
