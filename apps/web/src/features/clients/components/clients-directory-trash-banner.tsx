'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ClientsDirectoryTrashBannerProps {
  entityLabel: string;
  onBackToActive: () => void;
}

export function ClientsDirectoryTrashBanner({
  entityLabel,
  onBackToActive,
}: ClientsDirectoryTrashBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="text-muted-foreground text-sm">
        Viewing Trash — removed {entityLabel} can be restored from the list or detail sheet.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onBackToActive}>
        <ArrowLeft className="size-4" aria-hidden />
        Back to active
      </Button>
    </div>
  );
}
