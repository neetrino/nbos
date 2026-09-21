'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ReplaceAssigneeDialog } from './replace-assignee-dialog';

export function ReplaceAssigneeTrigger({
  configurationId,
  onReplaced,
}: {
  configurationId: string;
  onReplaced: () => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t('replaceAssignee.trigger')}
      </Button>
      <ReplaceAssigneeDialog
        open={open}
        onOpenChange={setOpen}
        configurationId={configurationId}
        onReplaced={onReplaced}
      />
    </>
  );
}
