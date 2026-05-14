import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkActionBar({
  count,
  archived,
  busy,
  onArchive,
  onRestore,
  onClear,
}: {
  count: number;
  archived: boolean;
  busy: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onClear: () => void;
}) {
  return (
    <div className="border-border/70 bg-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">{count} selected</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={archived ? onRestore : onArchive}
        >
          <Archive />
          {archived ? 'Restore selected' : 'Archive selected'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
