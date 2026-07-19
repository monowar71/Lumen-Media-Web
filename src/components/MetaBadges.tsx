import type { ReactNode } from 'react';

export function MetaBadges({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 text-sm text-muted">{children}</div>;
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted">{children}</span>
  );
}

export function Dot() {
  return <span aria-hidden>·</span>;
}
