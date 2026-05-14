import type { ChangeEvent } from 'react';
import { FolderPlus, Grid3X3, List, Search, Table2, Upload, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  PURPOSE_OPTIONS,
  STATUS_FILTERS,
  type DriveLibraryOption,
  type DriveStatusFilter,
  type DriveViewMode,
} from './drive-options';
import { formatDriveLabel } from './drive-format';
import { ALL_PURPOSES, type PurposeFilter } from './drive-types';

export function DriveToolbar({
  library,
  search,
  status,
  purpose,
  viewMode,
  lockedStatus,
  freeDriveSpace,
  busy,
  onSearchChange,
  onStatusChange,
  onPurposeChange,
  onViewModeChange,
  onCreateFolder,
  onFolderUpload,
}: {
  library: DriveLibraryOption;
  search: string;
  status: DriveStatusFilter;
  purpose: PurposeFilter;
  viewMode: DriveViewMode;
  lockedStatus?: DriveStatusFilter;
  freeDriveSpace: 'COMPANY' | 'PERSONAL' | null;
  busy: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DriveStatusFilter) => void;
  onPurposeChange: (value: PurposeFilter) => void;
  onViewModeChange: (value: DriveViewMode) => void;
  onCreateFolder: () => void;
  onFolderUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 rounded-3xl border p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-foreground text-lg font-semibold">{library.title}</h2>
          <p className="text-muted-foreground text-sm">{library.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {freeDriveSpace && (
            <>
              <Button type="button" variant="outline" onClick={onCreateFolder} disabled={busy}>
                <FolderPlus />
                New folder
              </Button>
              <label className="border-border bg-background hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium">
                <Upload className="size-4" />
                Upload files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={onFolderUpload}
                />
              </label>
              <label className="border-border bg-background hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium">
                <FolderPlus className="size-4" />
                Upload folder
                <FolderUploadInput disabled={busy} onChange={onFolderUpload} />
              </label>
            </>
          )}
          <ViewModeSwitch value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or original filename..."
            className="pl-9"
          />
        </div>
        <StatusSelect
          value={lockedStatus ?? status}
          locked={Boolean(lockedStatus)}
          onChange={onStatusChange}
        />
        <PurposeSelect value={purpose} onChange={onPurposeChange} />
      </div>
    </div>
  );
}

function FolderUploadInput({
  disabled,
  onChange,
}: {
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="file"
      multiple
      className="hidden"
      disabled={disabled}
      onChange={onChange}
      {...{ webkitdirectory: '', directory: '' }}
    />
  );
}

function StatusSelect({
  value,
  locked,
  onChange,
}: {
  value: DriveStatusFilter;
  locked: boolean;
  onChange: (value: DriveStatusFilter) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(item) => onChange(item as DriveStatusFilter)}
      disabled={locked}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_FILTERS.map((item) => (
          <SelectItem key={item} value={item}>
            {formatDriveLabel(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PurposeSelect({
  value,
  onChange,
}: {
  value: PurposeFilter;
  onChange: (value: PurposeFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={(item) => onChange(item as PurposeFilter)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PURPOSES}>All purposes</SelectItem>
        {PURPOSE_OPTIONS.map((item) => (
          <SelectItem key={item} value={item}>
            {formatDriveLabel(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ViewModeSwitch({
  value,
  onChange,
}: {
  value: DriveViewMode;
  onChange: (value: DriveViewMode) => void;
}) {
  const options: Array<{ value: DriveViewMode; label: string; icon: LucideIcon }> = [
    { value: 'cards', label: 'Cards', icon: Grid3X3 },
    { value: 'list', label: 'List', icon: List },
    { value: 'table', label: 'Table', icon: Table2 },
  ];

  return (
    <div className="bg-muted/60 flex w-fit rounded-2xl p-1">
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
        'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {option.label}
    </button>
  );
}
