import Link from 'next/link';
import { XIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/shared';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import { cn } from '@/lib/utils';
import { DeliveryStageReadinessRing } from './DeliveryStageReadinessRing';

interface DeliveryItemDetailHeaderProps {
  title: string;
  entityKind: 'PRODUCT' | 'EXTENSION';
  projectCode: string;
  projectName: string;
  projectHref: string;
  lifecycle: DeliveryLifecycleProjection | undefined;
  deadline: string | null;
  workSpaceHref: string;
  sourcePageHref: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DeliveryItemDetailHeader({
  title,
  entityKind,
  projectCode,
  projectName,
  projectHref,
  lifecycle,
  deadline,
  workSpaceHref,
  sourcePageHref,
  loading,
  onRefresh,
}: DeliveryItemDetailHeaderProps) {
  const terminal = Boolean(lifecycle?.isTerminal);
  const deadlineRisk = getDeadlineRisk(deadline);

  return (
    <div className="from-muted/40 via-background to-background border-border shrink-0 border-b bg-gradient-to-br from-indigo-50/40 px-5 pt-4 pb-3 sm:px-7 dark:from-indigo-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {entityKind === 'PRODUCT' ? 'Product' : 'Extension'}
            </span>
            {lifecycle ? (
              <StatusBadge
                label={formatDeliveryLifecycleLabel(lifecycle)}
                variant={getDeliveryLifecycleVariant(lifecycle)}
              />
            ) : null}
            {lifecycle && !lifecycle.isTerminal ? (
              <DeliveryStageReadinessRing lifecycle={lifecycle} />
            ) : null}
          </div>
          <h2
            className="text-foreground mt-2 truncate text-xl font-bold tracking-tight"
            title={title}
          >
            {loading ? '…' : title}
          </h2>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
            <Link
              href={projectHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {projectCode}
            </Link>
            <span className="text-muted-foreground/80"> · </span>
            <span>{projectName}</span>
          </p>
          {lifecycle?.workStatus === 'ON_HOLD' && lifecycle.onHoldReason ? (
            <p className="text-muted-foreground mt-2 text-xs">On hold: {lifecycle.onHoldReason}</p>
          ) : null}
          {deadline ? (
            <p
              className={cn('mt-1 text-xs font-medium', deadlineRisk.className)}
              title="Delivery deadline"
            >
              Deadline: {new Date(deadline).toLocaleDateString()}
              {deadlineRisk.label ? ` · ${deadlineRisk.label}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <SheetClose
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
              'text-muted-foreground',
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={workSpaceHref}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              Work Space
            </Link>
            <Link
              href={sourcePageHref}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              {entityKind === 'PRODUCT' ? 'Open product' : 'Open on product'}
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          {!terminal ? (
            <p className="text-muted-foreground max-w-[14rem] text-right text-[10px] leading-snug">
              Stage moves and pause/cancel run on the product page with full validation.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getDeadlineRisk(deadline: string | null): { label: string; className: string } {
  if (!deadline) return { label: '', className: '' };
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return { label: '', className: 'text-muted-foreground' };
  const now = new Date();
  if (d.getTime() < now.getTime()) {
    return { label: 'Overdue', className: 'text-destructive' };
  }
  const days = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 7) {
    return { label: 'Due soon', className: 'text-amber-700 dark:text-amber-400' };
  }
  return { label: '', className: 'text-muted-foreground' };
}
