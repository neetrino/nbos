import { Grid3X3, LayoutGrid, List, Table2 } from 'lucide-react';
import { ViewModeSwitch, type ViewModeOption } from '@/components/shared';
import type { DriveViewMode } from './drive-options';

const DRIVE_VIEW_OPTIONS: ViewModeOption<DriveViewMode>[] = [
  { value: 'cards', label: 'Cards', icon: <Grid3X3 className="size-3.5 shrink-0" aria-hidden /> },
  {
    value: 'tiles',
    label: 'Tiles',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
  },
  { value: 'list', label: 'List', icon: <List className="size-3.5 shrink-0" aria-hidden /> },
  { value: 'table', label: 'Table', icon: <Table2 className="size-3.5 shrink-0" aria-hidden /> },
];

export function DriveViewModeSwitch({
  value,
  onChange,
  className,
}: {
  value: DriveViewMode;
  onChange: (value: DriveViewMode) => void;
  className?: string;
}) {
  return (
    <ViewModeSwitch
      value={value}
      onChange={onChange}
      options={DRIVE_VIEW_OPTIONS}
      className={className}
    />
  );
}
