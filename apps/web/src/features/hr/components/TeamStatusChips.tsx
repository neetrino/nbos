'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EMPLOYEE_STATUSES } from '@/features/hr/constants/hr';

export function DirectoryCountChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className="h-9 gap-2 rounded-full px-3.5 text-sm"
      onClick={onClick}
    >
      {label}
      <span
        className={cn(
          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
          active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {count}
      </span>
    </Button>
  );
}

export interface TeamStatusChipsProps {
  activeStatus: string | null;
  defaultScopeActive: boolean;
  onStatusChange: (status: string | null) => void;
  counts: Record<string, number>;
  showTerminated: boolean;
  onToggleTerminated: () => void;
  terminatedCount: number;
  allCount: number;
}

export function TeamStatusChips({
  activeStatus,
  defaultScopeActive,
  onStatusChange,
  counts,
  showTerminated,
  onToggleTerminated,
  terminatedCount,
  allCount,
}: TeamStatusChipsProps) {
  const t = useTranslations('hr');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DirectoryCountChip
        active={defaultScopeActive}
        label={t('directory.all')}
        count={allCount}
        onClick={() => onStatusChange(null)}
      />
      {EMPLOYEE_STATUSES.filter((status) => status.value !== 'TERMINATED').map((status) => {
        const active = activeStatus === status.value;
        return (
          <DirectoryCountChip
            key={status.value}
            active={active}
            label={t(`status.${status.value}`)}
            count={counts[status.value] ?? 0}
            onClick={() => onStatusChange(active ? null : status.value)}
          />
        );
      })}
      {terminatedCount > 0 && (
        <DirectoryCountChip
          active={showTerminated}
          label={t('status.TERMINATED')}
          count={terminatedCount}
          onClick={onToggleTerminated}
        />
      )}
    </div>
  );
}
