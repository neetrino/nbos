'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function NormsRowActions({
  canEdit,
  editLabel,
  onToggleEdit,
  publish,
}: {
  canEdit: boolean;
  editLabel: string;
  onToggleEdit: () => void;
  publish?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit ? (
        <Button type="button" variant="outline" size="sm" onClick={onToggleEdit}>
          {editLabel}
        </Button>
      ) : null}
      {publish}
    </div>
  );
}
