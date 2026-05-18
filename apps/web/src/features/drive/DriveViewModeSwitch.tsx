import { Grid3X3, LayoutGrid, List, Table2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveViewMode } from './drive-options';

export function DriveViewModeSwitch({
  value,
  onChange,
  className,
}: {
  value: DriveViewMode;
  onChange: (value: DriveViewMode) => void;
  className?: string;
}) {
  const options: Array<{ value: DriveViewMode; label: string; icon: LucideIcon }> = [
    { value: 'cards', label: 'Cards', icon: Grid3X3 },
    { value: 'tiles', label: 'Tiles', icon: LayoutGrid },
    { value: 'list', label: 'List', icon: List },
    { value: 'table', label: 'Table', icon: Table2 },
  ];

  return (
    <div
      className={cn(
        'bg-muted/70 flex w-fit shrink-0 items-center gap-0.5 rounded-full p-1',
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      {options.map((option) => (
        <ViewModeButton
          key={option.value}
          option={option}
          active={value === option.value}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function ViewModeButton({
  option,
  active,
  onChange,
}: {
  option: { value: DriveViewMode; label: string; icon: LucideIcon };
  active: boolean;
  onChange: (value: DriveViewMode) => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={() => onChange(option.value)}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {option.label}
    </button>
  );
}
