'use client';

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
import { getLeadSource, getLeadStage } from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  onConvertToDeal?: (lead: Lead) => void;
}

export function LeadCard({ lead, onClick, onStatusChange, onConvertToDeal }: LeadCardProps) {
  const source = getLeadSource(lead.source);
  const stage = getLeadStage(lead.status);

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = lead.status === 'NEW' && daysSinceCreation >= 1;

  return (
    <div
      className="group border-border bg-card cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md"
      onClick={() => onClick(lead)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[10px] font-medium">{lead.code}</p>
          <h4 className="text-foreground mt-0.5 truncate text-sm font-semibold">
            {lead.name || lead.code}
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
            <DropdownMenuItem onClick={() => onClick(lead)}>View Details</DropdownMenuItem>
            {lead.status === 'MQL' && (
              <DropdownMenuItem onClick={() => onConvertToDeal?.(lead)}>
                Convert to Deal
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {lead.status !== 'SPAM' && (
              <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'SPAM')}>
                Mark as Spam
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <User size={11} />
          <span>{lead.contactName}</span>
        </div>
        {lead.phone && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Phone size={11} />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Mail size={11} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge label={source?.label ?? lead.source} variant="default" />
        <div className="flex items-center gap-2">
          {lead.assignee && (
            <div className="bg-accent/20 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold">
              {lead.assignee.firstName[0]}
              {lead.assignee.lastName[0]}
            </div>
          )}
          {isOverdue && (
            <div className="text-destructive flex items-center gap-1 text-[10px]">
              <Calendar size={10} />
              <span>{daysSinceCreation}d</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
