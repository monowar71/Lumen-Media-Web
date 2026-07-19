import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconCheck } from './PlayerIcons';

export interface TrackOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface TrackMenuProps {
  label: string;
  triggerLabel: string;
  icon?: ReactNode;
  options: TrackOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function TrackMenu({
  label,
  triggerLabel,
  icon,
  options,
  selectedId,
  onSelect,
  disabled,
}: TrackMenuProps) {
  if (options.length === 0) return null;
  const selected = options.find((o) => o.id === selectedId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-white/90',
            'bg-white/5 ring-1 ring-white/10 backdrop-blur-md transition',
            'hover:bg-white/12 hover:text-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            'disabled:opacity-40',
          )}
        >
          {icon}
          <span className="hidden max-w-28 truncate sm:inline">{selected?.label ?? triggerLabel}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={10}
          className={cn(
            'z-50 min-w-52 overflow-hidden rounded-2xl border border-white/10',
            'bg-surface/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          <DropdownMenu.Label className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {label}
          </DropdownMenu.Label>
          {options.map((opt) => {
            const active = opt.id === selectedId;
            return (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={() => onSelect(opt.id)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm outline-none',
                  'text-text transition-colors',
                  'data-[highlighted]:bg-white/8',
                  active && 'bg-accent/10 text-accent',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="mt-0.5 block truncate text-xs text-muted">{opt.sublabel}</span>
                  )}
                </span>
                {active && <IconCheck size={16} className="text-accent" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
