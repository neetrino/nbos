import type { ChangeEvent } from 'react';
import { FolderPlus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DriveToolbar({
  search,
  freeDriveSpace,
  busy,
  onSearchChange,
  onCreateFolder,
  onFolderUpload,
}: {
  search: string;
  freeDriveSpace: 'COMPANY' | 'PERSONAL' | null;
  busy: boolean;
  onSearchChange: (value: string) => void;
  onCreateFolder: () => void;
  onFolderUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 rounded-3xl border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or filename…"
            className="pl-9"
          />
        </div>
        {freeDriveSpace ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
          </div>
        ) : null}
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
