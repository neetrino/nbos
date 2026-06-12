'use client';

import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { EntityLifecycleScope } from '@nbos/shared';

export interface ClientsDirectorySettingsSheetProps {
  listScope: EntityLifecycleScope;
  onListScopeChange: (scope: EntityLifecycleScope) => void;
  entityLabel: string;
}

export function ClientsDirectorySettingsSheet({
  listScope,
  onListScopeChange,
  entityLabel,
}: ClientsDirectorySettingsSheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isTrashList = listScope === 'trash';

  const handleScopeChange = (scope: EntityLifecycleScope) => {
    onListScopeChange(scope);
    setSheetOpen(false);
  };

  return (
    <PageSettingsSheet
      title={`Clients — ${entityLabel}`}
      description={
        isTrashList
          ? 'Trash view. Restore items from the list or return to active directory.'
          : 'Active directory. Open Trash to review removed items.'
      }
      triggerAriaLabel={`${entityLabel} settings`}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    >
      {isTrashList ? (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => handleScopeChange('active')}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to active list
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => handleScopeChange('trash')}
        >
          <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
          View Trash
        </Button>
      )}
    </PageSettingsSheet>
  );
}
