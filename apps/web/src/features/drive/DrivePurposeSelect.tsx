'use client';

import { formatDriveLabel } from './drive-utils';
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
      <select
        className="border-input bg-background h-8 rounded-md border px-2 text-xs"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {purposes.map((purpose) => (
          <option key={purpose} value={purpose}>
            {formatDriveLabel(purpose)}
          </option>
        ))}
        <option value="OTHER">{formatDriveLabel('OTHER')}</option>
      </select>
    </label>
  );
}
