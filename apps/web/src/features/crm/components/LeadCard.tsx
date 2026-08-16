'use client';

import { useSyncExternalStore } from 'react';
import { Phone, Mail, User, Calendar } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { employeeFullName } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';
import { getLeadSource } from '../constants/leadPipeline';
import { formatMarketingChannelLabel } from '../utils/formatMarketingChannel';
import type { Lead } from '@/lib/api/leads';
import { LEAD_ENTITY_VISUAL } from '@/lib/lead-entity-visual';
import {
  getLeadCardMetaLabel,
  getLeadDisplayTitle,
  getLeadLatestMessagePreview,
} from '../utils/crm-entity-display';

const LEAD_CARD_PERSON_AVATAR_CLASS = 'size-6 text-[9px]';

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
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const leadVisual = LEAD_ENTITY_VISUAL;
  const title = getLeadDisplayTitle(lead);
  const metaLabel = getLeadCardMetaLabel(lead);
  const latestMessage = getLeadLatestMessagePreview(lead);
  const LeadIcon = leadVisual.Icon;
  const source = getLeadSource(lead.source);
  const channelLabel = formatMarketingChannelLabel(lead);
  const currentTime = useSyncExternalStore(
    subscribeToClock,
    getCurrentTimeSnapshot,
    getCurrentTimeSnapshot,
  );

  const daysSinceCreation = Math.floor((currentTime - new Date(lead.createdAt).getTime()) / DAY_MS);
  const isOverdue = lead.status === 'NEW' && daysSinceCreation >= 1;
  const assigneeName = lead.assignee ? employeeFullName(lead.assignee) : null;

  return (
    <KanbanCardShell
      preset="crm"
      padding="lg"
      baseShadow="sm"
      hoverShadow="md"
      transition="all"
      shellClassName={cn('group cursor-pointer', leadVisual.cardShellClassName)}
      onClick={() => onClick(lead)}
    >
      <div className="flex items-start gap-2">
        <span
          className={`rounded-lg p-1.5 ${leadVisual.iconWrapClassName}`}
          title={leadVisual.label}
        >
          <LeadIcon size={14} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-snug font-semibold">{title}</p>
          {metaLabel ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{metaLabel}</p>
          ) : null}
          {latestMessage ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug break-words">
              {latestMessage}
            </p>
          ) : null}
        </div>
        {source ? (
          <StatusBadge
            label={`${source.icon} ${source.label}`}
            variant="default"
            className="h-5 shrink-0 self-start px-1.5 py-0 text-[10px] leading-none"
          />
        ) : null}
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
          {channelLabel ? (
            <span className="text-muted-foreground truncate text-[10px]">{channelLabel}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {lead.assignee && assigneeName ? (
            <span title={assigneeName}>
              <EmployeePersonAvatar
                label={assigneeName}
                imageUrl={lead.assignee.avatar}
                className={LEAD_CARD_PERSON_AVATAR_CLASS}
              />
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
    </KanbanCardShell>
  );
}
