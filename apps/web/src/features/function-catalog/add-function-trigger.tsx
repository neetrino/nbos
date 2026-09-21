'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FunctionCatalogPickerDialog } from './function-catalog-picker-dialog';

export function AddFunctionTrigger({
  configurationId,
  alreadyAddedIds,
  onAdded,
  expectedRevision,
  requireReason,
}: {
  configurationId: string;
  alreadyAddedIds: ReadonlySet<string>;
  onAdded: () => void;
  expectedRevision: number;
  requireReason: boolean;
}) {
  const t = useTranslations('hr.functionCatalog');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        {t('addFunction')}
      </Button>
      <FunctionCatalogPickerDialog
        open={open}
        onOpenChange={setOpen}
        configurationId={configurationId}
        alreadyAddedIds={alreadyAddedIds}
        onAdded={onAdded}
        expectedRevision={expectedRevision}
        requireReason={requireReason}
      />
    </>
  );
}
