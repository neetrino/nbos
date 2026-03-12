'use client';

import { DollarSign, User, Briefcase, Calendar, MoreHorizontal, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { getDealStage, formatAmount } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function DealCard({ deal, onClick, onStatusChange }: DealCardProps) {
  const isExtension = deal.type === 'EXTENSION';

  return (
    <div
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
        isExtension
          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'
          : 'border-border bg-card'
      }`}
      onClick={() => onClick(deal)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-muted-foreground text-[10px] font-medium">{deal.code}</p>
            {isExtension && <StatusBadge label="Extension" variant="blue" className="text-[9px]" />}
          </div>
          <h4 className="text-foreground mt-0.5 truncate text-sm font-semibold">
            {deal.contact?.firstName} {deal.contact?.lastName}
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
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Briefcase size={11} />
          <span>{deal.type.replace(/_/g, ' ')}</span>
        </div>
        {deal.amount && (
          <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
            <DollarSign size={13} className="text-accent" />
            <span>{formatAmount(deal.amount)}</span>
          </div>
        )}
        {deal.seller && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={11} />
            <span>
              {deal.seller.firstName} {deal.seller.lastName}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {deal.lead ? (
          <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
            <Link2 size={10} />
            <span>{deal.lead.code}</span>
          </div>
        ) : (
          <span />
        )}
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
