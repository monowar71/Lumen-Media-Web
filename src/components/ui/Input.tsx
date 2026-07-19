import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text',
        'placeholder:text-muted focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  );
});
