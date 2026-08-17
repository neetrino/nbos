'use client';

import { Pause, Play, Repeat, Trash2, Zap } from 'lucide-react';
import { DetailSheetSettingsMenu, StatusBadge } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface RecurringTaskSheetHeaderProps {
  title: string;
  isCreate: boolean;
  isActive: boolean;
  canEdit: boolean;
  canDelete: boolean;
  running: boolean;
  onRunNow: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function RecurringTaskSheetHeader({
  title,
  isCreate,
  isActive,
  canEdit,
  canDelete,
  running,
  onRunNow,
  onToggleActive,
  onDelete,
}: RecurringTaskSheetHeaderProps) {
  return (
    <div className="bg-background flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <h2 className="text-foreground truncate text-xl font-bold tracking-tight">{title}</h2>
          {!isCreate ? (
            <StatusBadge
              label={isActive ? 'Active' : 'Paused'}
              variant={isActive ? 'green' : 'gray'}
            />
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Template only. Tasks are created on the schedule, or immediately with Create task now.
        </p>
      </div>
      {!isCreate && (canEdit || canDelete) ? (
        <DetailSheetSettingsMenu>
          {canEdit ? (
            <DropdownMenuItem disabled={running} onClick={onRunNow}>
              <Zap />
              Create task now
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem onClick={onToggleActive}>
              {isActive ? <Pause /> : <Play />}
              {isActive ? 'Pause schedule' : 'Resume schedule'}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : null}
    </div>
  );
}
