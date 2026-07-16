'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDriveLabel } from './drive-format';
import type { DriveLibraryOption } from './drive-options';

export function DrivePurposeSelect({
  library,
  value,
  disabled,
  onChange,
}: {
  library: DriveLibraryOption;
  value: string;
  disabled?: boolean;
  onChange: (purpose: string) => void;
}) {
  const purposes = library.purposes ?? [];
  if (purposes.length <= 1) return null;

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground font-medium">Purpose</span>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Purpose" />
        </SelectTrigger>
        <SelectContent>
          {purposes.map((purpose) => (
            <SelectItem key={purpose} value={purpose}>
              {formatDriveLabel(purpose)}
            </SelectItem>
          ))}
          <SelectItem value="OTHER">{formatDriveLabel('OTHER')}</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}
