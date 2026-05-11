'use client';

import { DollarSign, User, MoreHorizontal, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { getDealTypePresentation } from '@/lib/deal-type-visual';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function DealCard({ deal, onClick, onStatusChange }: DealCardProps) {
  const typeVisual = getDealTypePresentation(deal.type);
  const TypeIcon = typeVisual.Icon;

  return (
    <div
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${typeVisual.cardShellClassName}`}
      onClick={() => onClick(deal)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-muted-foreground text-[10px] font-medium">{deal.code}</p>
            <StatusBadge
              label={typeVisual.label}
              variant={typeVisual.badgeVariant}
              className="text-[9px]"
            />
          </div>
          <h4 className="text-foreground mt-0.5 truncate text-sm font-semibold">
            {deal.name || deal.code}
          </h4>
        </div>
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
            <DropdownMenuItem onClick={() => onClick(deal)}>View Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-green-600"
              onClick={() => onStatusChange(deal.id, 'WON')}
            >
              Mark as Won
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onStatusChange(deal.id, 'FAILED')}
            >
              Mark as Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 space-y-1">
        {deal.contact && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={11} />
            <span>
              {deal.contact.firstName} {deal.contact.lastName}
            </span>
          </div>
        )}
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <TypeIcon size={11} className={`shrink-0 ${typeVisual.metaTypeIconClassName}`} />
          <span>{typeVisual.label}</span>
        </div>
        {deal.amount && (
          <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
            <DollarSign size={13} className={`shrink-0 ${typeVisual.amountIconClassName}`} />
            <span>{formatAmount(deal.amount)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 -space-x-1.5">
            <span
              className="ring-card relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 ring-2 dark:bg-amber-950/40 dark:text-amber-300"
              title={`Seller: ${deal.seller.firstName} ${deal.seller.lastName}`}
            >
              {deal.seller.firstName[0]}
              {deal.seller.lastName[0]}
            </span>
            {deal.sellerAssistant && (
              <span
                className="ring-card relative flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 ring-2 dark:bg-violet-950/40 dark:text-violet-300"
                title={`Assistant: ${deal.sellerAssistant.firstName} ${deal.sellerAssistant.lastName}`}
              >
                {deal.sellerAssistant.firstName[0]}
                {deal.sellerAssistant.lastName[0]}
              </span>
            )}
          </div>
          {deal.lead ? (
            <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-[10px]">
              <Link2 size={10} className="shrink-0" />
              <span className="truncate">{deal.lead.code}</span>
            </div>
          ) : null}
        </div>
        {deal.paymentType && (
          <StatusBadge
            label={deal.paymentType.replace(/_/g, ' ')}
            variant="amber"
            className="text-[9px]"
          />
        )}
      </div>
    </div>
  );
}
