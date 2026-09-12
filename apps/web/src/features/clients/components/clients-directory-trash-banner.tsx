'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ClientsDirectoryTrashBannerProps {
  entityLabel: string;
  onBackToActive: () => void;
  message?: string;
  backLabel?: string;
}

export function ClientsDirectoryTrashBanner({
  onBackToActive,
  message = 'Viewing Trash — restore from the detail sheet, or delete permanently (name confirmation).',
  backLabel = 'Back to active',
}: ClientsDirectoryTrashBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onBackToActive}>
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Button>
    </div>
  );
}
