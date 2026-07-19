import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface TrackOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface TrackMenuProps {
  label: string;
  triggerLabel: string;
  options: TrackOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function TrackMenu({
  label,
  triggerLabel,
  options,
  selectedId,
  onSelect,
  disabled,
}: TrackMenuProps) {
  if (options.length === 0) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-40"
        >
          {triggerLabel}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-2xl"
        >
          <DropdownMenu.Label className="px-2 py-1 text-xs uppercase tracking-wide text-muted">
            {label}
          </DropdownMenu.Label>
          {options.map((opt) => (
            <DropdownMenu.Item
              key={opt.id}
              onSelect={() => onSelect(opt.id)}
              className="flex cursor-pointer items-center justify-between gap-4 rounded px-2 py-1.5 text-sm text-text outline-none data-[highlighted]:bg-surface-2"
            >
              <span>
                {opt.label}
                {opt.sublabel && <span className="ml-2 text-xs text-muted">{opt.sublabel}</span>}
              </span>
              {opt.id === selectedId && <span className="text-accent">✓</span>}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
