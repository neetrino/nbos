'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DRIVE_LIBRARIES, type DriveLibraryKey, type DriveLibraryOption } from './drive-options';
import { uploadDriveFilesToEntity } from './drive-entity-upload';

function resolveDriveLibraryOption(key: DriveLibraryKey): DriveLibraryOption {
  const lib = DRIVE_LIBRARIES.find((item) => item.key === key);
  if (!lib) {
    throw new Error(`Drive library '${key}' is missing.`);
  }
  return lib;
}

export function EntityDriveQuickAttach({
  entityType,
  entityId,
  libraryKey = 'projects',
  onUploaded,
}: {
  entityType: string;
  entityId: string;
  /** Library defaults for upload session (`sourceModule` / `purpose` / `visibility`). */
  libraryKey?: DriveLibraryKey;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    try {
      await uploadDriveFilesToEntity(
        files,
        { entityType, entityId },
        resolveDriveLibraryOption(libraryKey),
      );
      toast.success(files.length === 1 ? 'File attached' : `${files.length} files attached`);
      onUploaded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" multiple onChange={onChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" aria-hidden />
        Attach files
      </Button>
    </>
  );
}
