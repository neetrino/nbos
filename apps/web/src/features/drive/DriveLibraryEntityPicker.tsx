'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DriveLibraryKey } from './drive-options';
import {
  loadDriveLibraryEntityRows,
  type DriveLibraryEntityRow,
} from './drive-library-entity-loaders';

export type LibraryUploadLink = { entityType: string; entityId: string };

export function DriveLibraryEntityPicker({
  libraryKey,
  value,
  onChange,
}: {
  libraryKey: DriveLibraryKey;
  value: LibraryUploadLink | null;
  onChange: (next: LibraryUploadLink | null) => void;
}) {
  const [rows, setRows] = useState<DriveLibraryEntityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadDriveLibraryEntityRows(libraryKey)
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Could not load records for this library');
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [libraryKey]);

  const composite = useMemo(() => (value ? `${value.entityType}:${value.entityId}` : ''), [value]);

  return (
    <div className="border-border/60 bg-muted/20 mb-2 rounded-2xl border px-2.5 py-2">
      <Label className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wide uppercase">
        Link uploads to
      </Label>
      <Select
        disabled={loading || rows.length === 0}
        value={composite || undefined}
        onValueChange={(next) => {
          if (!next) {
            onChange(null);
            return;
          }
          const [entityType, entityId] = next.split(':');
          if (entityType && entityId) onChange({ entityType, entityId });
        }}
      >
        <SelectTrigger className="bg-background h-9 w-full rounded-xl text-left text-xs">
          <SelectValue
            placeholder={
              loading ? 'Loading…' : rows.length === 0 ? 'Nothing to link yet' : 'Choose a record…'
            }
          />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {rows.map((row) => (
            <SelectItem
              key={`${row.entityType}:${row.id}`}
              value={`${row.entityType}:${row.id}`}
              className="text-xs"
            >
              <span className="truncate">{row.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
