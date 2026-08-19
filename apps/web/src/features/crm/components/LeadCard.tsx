'use client';

import { Calendar, Mail, Phone, User, type LucideIcon } from 'lucide-react';
import { useCurrentTimeSnapshot } from '@/hooks/use-current-time-snapshot';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import {
  TYPE_TINTED_BOARD_CARD_ACCENT_BAR_CLASS,
  TYPE_TINTED_BOARD_CARD_BODY_STACK_CLASS,
  TYPE_TINTED_BOARD_CARD_DATE_ICON_SIZE,
  TYPE_TINTED_BOARD_CARD_DATE_LABEL_CLASS,
  TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS,
  TYPE_TINTED_BOARD_CARD_META_ICON_BASE_CLASS,
  TYPE_TINTED_BOARD_CARD_META_LABEL_CLASS,
  TYPE_TINTED_BOARD_CARD_META_ROW_CLASS,
  TYPE_TINTED_BOARD_CARD_SHELL_CLASS,
} from '@/components/shared/kanban/type-tinted-board-card-ui.constants';
import { employeeFullName } from '@/features/hr/utils/employee-display';
import { formatBoardCardDate } from '@/lib/format/board-card-date';
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
import { BoardCardCreateTaskButton } from './BoardCardCreateTaskButton';

const LEAD_CARD_PERSON_AVATAR_CLASS = 'size-6 text-[9px]';
const LEAD_CARD_ACCENT_FILL_CLASS = 'bg-sky-500';
const LEAD_CARD_DATE_ICON_WRAP_CLASS =
  'bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300';
const DAY_MS = 1000 * 60 * 60 * 24;

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onCreateTask?: (lead: Lead) => void;
}

export function LeadCard({ lead, onClick, onCreateTask }: LeadCardProps) {
  const leadVisual = LEAD_ENTITY_VISUAL;
  const currentTime = useCurrentTimeSnapshot();
  const view = getLeadCardView(lead, currentTime);

  return (
    <KanbanCardShell
      preset="crm"
      padding="lg"
      radius="xl"
      baseShadow="sm"
      hoverShadow="md"
      transition="all"
      shellClassName={cn(
        'group relative w-full cursor-pointer text-left',
        TYPE_TINTED_BOARD_CARD_SHELL_CLASS,
      )}
      onClick={() => onClick(lead)}
    >
      <LeadCardHeader
        title={view.title}
        metaLabel={view.metaLabel}
        sourceLabel={view.sourceLabel}
        Icon={leadVisual.Icon}
        iconWrapClassName={leadVisual.iconWrapClassName}
        entityLabel={leadVisual.label}
      />
      <div
        className={cn(TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS, 'border-border/50 mt-3')}
        aria-hidden
      />
      <LeadCardBody
        latestMessage={view.latestMessage}
        phone={lead.phone}
        email={lead.email}
        createdAt={lead.createdAt}
      />
      <LeadCardFooter
        assigneeName={view.assigneeName}
        assigneeAvatar={lead.assignee?.avatar}
        channelLabel={view.channelLabel}
        isOverdue={view.isOverdue}
        daysSinceCreation={view.daysSinceCreation}
        onCreateTask={onCreateTask ? () => onCreateTask(lead) : undefined}
      />
    </KanbanCardShell>
  );
}

function getLeadCardView(lead: Lead, currentTime: number) {
  const source = getLeadSource(lead.source);
  const daysSinceCreation = Math.floor((currentTime - new Date(lead.createdAt).getTime()) / DAY_MS);
  return {
    title: getLeadDisplayTitle(lead),
    metaLabel: getLeadCardMetaLabel(lead),
    latestMessage: getLeadLatestMessagePreview(lead),
    sourceLabel: source ? `${source.icon} ${source.label}` : null,
    channelLabel: formatMarketingChannelLabel(lead),
    daysSinceCreation,
    isOverdue: lead.status === 'NEW' && daysSinceCreation >= 1,
    assigneeName: lead.assignee ? employeeFullName(lead.assignee) : null,
  };
}

function LeadCardHeader({
  title,
  metaLabel,
  sourceLabel,
  Icon,
  iconWrapClassName,
  entityLabel,
}: {
  title: string;
  metaLabel: string | null;
  sourceLabel: string | null;
  Icon: typeof LEAD_ENTITY_VISUAL.Icon;
  iconWrapClassName: string;
  entityLabel: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(TYPE_TINTED_BOARD_CARD_ACCENT_BAR_CLASS, LEAD_CARD_ACCENT_FILL_CLASS)}
        aria-hidden
      />
      <span className={cn('rounded-lg p-1.5', iconWrapClassName)} title={entityLabel}>
        <Icon size={14} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-tight font-semibold">{title}</p>
        {metaLabel ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{metaLabel}</p>
        ) : null}
      </div>
      {sourceLabel ? (
        <StatusBadge
          label={sourceLabel}
          variant="default"
          className="h-5 shrink-0 self-start px-1.5 py-0 text-[10px] leading-none"
        />
      ) : null}
    </div>
  );
}

function LeadCardBody({
  latestMessage,
  phone,
  email,
  createdAt,
}: {
  latestMessage: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}) {
  return (
    <div className={TYPE_TINTED_BOARD_CARD_BODY_STACK_CLASS}>
      {latestMessage ? (
        <p className="text-muted-foreground line-clamp-2 text-xs leading-snug break-words">
          {latestMessage}
        </p>
      ) : null}
      {phone ? <LeadCardMetaLine icon={Phone} label={phone} /> : null}
      {email ? <LeadCardMetaLine icon={Mail} label={email} /> : null}
      <LeadCardMetaLine
        icon={Calendar}
        iconSize={TYPE_TINTED_BOARD_CARD_DATE_ICON_SIZE}
        label={formatBoardCardDate(createdAt)}
        labelClassName={TYPE_TINTED_BOARD_CARD_DATE_LABEL_CLASS}
      />
    </div>
  );
}

function LeadCardMetaLine({
  icon: Icon,
  label,
  iconSize = 14,
  labelClassName = TYPE_TINTED_BOARD_CARD_META_LABEL_CLASS,
}: {
  icon: LucideIcon;
  label: string;
  iconSize?: number;
  labelClassName?: string;
}) {
  return (
    <div className={TYPE_TINTED_BOARD_CARD_META_ROW_CLASS}>
      <span
        className={cn(TYPE_TINTED_BOARD_CARD_META_ICON_BASE_CLASS, LEAD_CARD_DATE_ICON_WRAP_CLASS)}
      >
        <Icon size={iconSize} aria-hidden />
      </span>
      <span className={labelClassName}>{label}</span>
    </div>
  );
}

function LeadCardFooter({
  assigneeName,
  assigneeAvatar,
  channelLabel,
  isOverdue,
  daysSinceCreation,
  onCreateTask,
}: {
  assigneeName: string | null;
  assigneeAvatar?: string | null;
  channelLabel: string | null;
  isOverdue: boolean;
  daysSinceCreation: number;
  onCreateTask?: () => void;
}) {
  return (
    <div className="mt-2.5 flex items-end gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {assigneeName ? (
          <span title={assigneeName}>
            <EmployeePersonAvatar
              label={assigneeName}
              imageUrl={assigneeAvatar}
              className={LEAD_CARD_PERSON_AVATAR_CLASS}
            />
          </span>
        ) : (
          <span className="text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
            <User size={10} />
          </span>
        )}
        {channelLabel ? (
          <span className="text-muted-foreground truncate text-[10px]">{channelLabel}</span>
        ) : null}
        {isOverdue ? (
          <StatusBadge label={`${daysSinceCreation}d`} variant="red" className="text-[9px]" />
        ) : null}
      </div>
      {onCreateTask ? <BoardCardCreateTaskButton onCreateTask={onCreateTask} /> : null}
    </div>
  );
}
