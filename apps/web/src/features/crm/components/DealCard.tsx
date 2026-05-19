'use client';

import { Building2, Calendar, MoreHorizontal, Link2, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { formatAmount, AMD_CURRENCY_SYMBOL } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { getDealTypePresentation } from '@/lib/deal-type-visual';
import { getDealCardMetaLabel, getDealDisplayTitle } from '../utils/crm-entity-display';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function DealCard({ deal, onClick, onStatusChange }: DealCardProps) {
  const typeVisual = getDealTypePresentation(deal.type);
  const title = getDealDisplayTitle(deal);
  const metaLabel = getDealCardMetaLabel(deal);
  const deadlineOverdue =
    deal.deadline && deal.status !== 'WON' && deal.status !== 'FAILED'
      ? new Date(deal.deadline).getTime() < Date.now()
      : false;
  const TypeIcon = typeVisual.Icon;

  return (
    <div
      className={`group cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${typeVisual.cardShellClassName}`}
      onClick={() => onClick(deal)}
    >
      <div className="flex items-start gap-2">
        <span
          className={`rounded-lg p-1.5 ${typeVisual.iconWrapClassName}`}
          title={typeVisual.label}
        >
          <TypeIcon size={14} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-snug font-semibold">{title}</p>
          {metaLabel ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{metaLabel}</p>
          ) : null}
          {deal.company?.name && metaLabel !== deal.company.name ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
              <Building2 size={10} className="shrink-0" />
              {deal.company.name}
            </p>
          ) : null}
        </div>
        <DealCardMenu deal={deal} onClick={onClick} onStatusChange={onStatusChange} />
      </div>

      {deal.amount ? (
        <p className="text-foreground mt-3 flex items-center gap-1.5 text-base font-semibold tabular-nums">
          <span className={typeVisual.amountIconClassName} aria-hidden>
            {AMD_CURRENCY_SYMBOL}
          </span>
          {formatAmount(deal.amount)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={typeVisual.label}
          variant={typeVisual.badgeVariant}
          className="text-[9px]"
        />
        {deal.paymentType ? (
          <StatusBadge
            label={deal.paymentType.replace(/_/g, ' ')}
            variant="amber"
            className="text-[9px]"
          />
        ) : null}
        {deal.deadline ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              deadlineOverdue
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Calendar size={10} />
            {new Date(deal.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 -space-x-1.5">
            <span
              className="ring-card relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 ring-2 dark:bg-amber-950/40 dark:text-amber-300"
              title={`Seller: ${deal.seller.firstName} ${deal.seller.lastName}`}
            >
              {deal.seller.firstName[0]}
              {deal.seller.lastName[0]}
            </span>
            {deal.sellerAssistant ? (
              <span
                className="ring-card relative flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 ring-2 dark:bg-violet-950/40 dark:text-violet-300"
                title={`Assistant: ${deal.sellerAssistant.firstName} ${deal.sellerAssistant.lastName}`}
              >
                {deal.sellerAssistant.firstName[0]}
                {deal.sellerAssistant.lastName[0]}
              </span>
            ) : null}
          </div>
          {deal.existingProduct ? (
            <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-[10px]">
              <Puzzle size={10} className="shrink-0" />
              <span className="truncate">{deal.existingProduct.name}</span>
            </span>
          ) : deal.lead ? (
            <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-[10px]">
              <Link2 size={10} className="shrink-0" />
              <span className="truncate">{deal.lead.code}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DealCardMenu({
  deal,
  onClick,
  onStatusChange,
}: {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              props.onClick?.(e);
            }}
          >
            <MoreHorizontal size={14} />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onClick(deal)}>View details</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-green-600" onClick={() => onStatusChange(deal.id, 'WON')}>
          Mark as won
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onStatusChange(deal.id, 'FAILED')}
        >
          Mark as failed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
