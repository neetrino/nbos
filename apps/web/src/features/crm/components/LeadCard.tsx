'use client';

import { useSyncExternalStore } from 'react';
import { Phone, Mail, User, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { getLeadSource } from '../constants/leadPipeline';
import { formatMarketingChannelLabel } from '../utils/formatMarketingChannel';
import type { Lead } from '@/lib/api/leads';

const DAY_MS = 1000 * 60 * 60 * 24;
const CLOCK_REFRESH_MS = 60 * 1000;

let currentTimeSnapshot = Date.now();
let clockTimerId: number | undefined;
const clockListeners = new Set<() => void>();

function subscribeToClock(onStoreChange: () => void): () => void {
  clockListeners.add(onStoreChange);
  if (!clockTimerId) {
    clockTimerId = window.setInterval(() => {
      currentTimeSnapshot = Date.now();
      clockListeners.forEach((listener) => listener());
    }, CLOCK_REFRESH_MS);
  }
  return () => {
    clockListeners.delete(onStoreChange);
    if (clockListeners.size === 0 && clockTimerId) {
      window.clearInterval(clockTimerId);
      clockTimerId = undefined;
    }
  };
}

function getCurrentTimeSnapshot(): number {
  return currentTimeSnapshot;
}

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onConvertToDeal?: (lead: Lead) => void;
}

export function LeadCard({ lead, onClick, onStatusChange, onConvertToDeal }: LeadCardProps) {
  const source = getLeadSource(lead.source);
  const channelLabel = formatMarketingChannelLabel(lead);
  const currentTime = useSyncExternalStore(
    subscribeToClock,
    getCurrentTimeSnapshot,
    getCurrentTimeSnapshot,
  );

  const daysSinceCreation = Math.floor((currentTime - new Date(lead.createdAt).getTime()) / DAY_MS);
  const isOverdue = lead.status === 'NEW' && daysSinceCreation >= 1;

  return (
    <div
      className="group border-border bg-card hover:border-primary/25 cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:shadow-md"
      onClick={() => onClick(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            {lead.code}
          </p>
          <h4 className="text-foreground mt-0.5 truncate text-sm font-semibold">
            {lead.contactName || lead.name || lead.code}
          </h4>
          {lead.name && lead.contactName ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{lead.name}</p>
          ) : null}
        </div>
        <LeadCardMenu
          lead={lead}
          onClick={onClick}
          onStatusChange={onStatusChange}
          onConvertToDeal={onConvertToDeal}
        />
      </div>

      <div className="mt-2.5 space-y-1">
        {lead.phone ? (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Phone size={11} className="shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        ) : null}
        {lead.email ? (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Mail size={11} className="shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {source ? (
            <StatusBadge
              label={`${source.icon} ${source.label}`}
              variant="default"
              className="text-[9px]"
            />
          ) : null}
          {channelLabel ? (
            <span className="text-muted-foreground truncate text-[10px]">{channelLabel}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {lead.assignee ? (
            <span
              className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold"
              title={`${lead.assignee.firstName} ${lead.assignee.lastName}`}
            >
              {lead.assignee.firstName[0]}
              {lead.assignee.lastName[0]}
            </span>
          ) : (
            <span className="text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
              <User size={10} />
            </span>
          )}
          <span className="text-muted-foreground flex items-center gap-0.5 text-[10px] tabular-nums">
            <Calendar size={10} />
            {new Date(lead.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {isOverdue ? (
            <StatusBadge label={`${daysSinceCreation}d`} variant="red" className="text-[9px]" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LeadCardMenu({
  lead,
  onClick,
  onStatusChange,
  onConvertToDeal,
}: {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onConvertToDeal?: (lead: Lead) => void;
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
        <DropdownMenuItem onClick={() => onClick(lead)}>View details</DropdownMenuItem>
        {lead.status === 'MQL' ? (
          <DropdownMenuItem onClick={() => onConvertToDeal?.(lead)}>
            Convert to deal
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {lead.status !== 'SPAM' ? (
          <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'SPAM')}>
            Mark as spam
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
