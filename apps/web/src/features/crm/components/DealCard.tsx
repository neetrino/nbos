'use client';

import { Building2, Calendar, Link2, MoreHorizontal, Puzzle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KanbanCardShell } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import {
  TYPE_TINTED_BOARD_CARD_ACCENT_BAR_CLASS,
  TYPE_TINTED_BOARD_CARD_BODY_STACK_CLASS,
  TYPE_TINTED_BOARD_CARD_DATE_ICON_SIZE,
  TYPE_TINTED_BOARD_CARD_DATE_LABEL_CLASS,
  TYPE_TINTED_BOARD_CARD_DATE_OVERDUE_LABEL_CLASS,
  TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS,
  TYPE_TINTED_BOARD_CARD_META_ICON_BASE_CLASS,
  TYPE_TINTED_BOARD_CARD_META_LABEL_CLASS,
  TYPE_TINTED_BOARD_CARD_META_ROW_CLASS,
  TYPE_TINTED_BOARD_CARD_SHELL_CLASS,
} from '@/components/shared/kanban/type-tinted-board-card-ui.constants';
import { employeeFullName } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';
import { formatBoardCardDate } from '@/lib/format/board-card-date';
import { getDealTypeCardChrome } from '@/lib/deal-type-card-chrome';
import { formatAmount, AMD_CURRENCY_SYMBOL } from '../constants/dealPipeline';
import type { Deal, DealEmployeeRef } from '@/lib/api/deals';
import { getDealTypePresentation, type DealTypePresentation } from '@/lib/deal-type-visual';
import { getDealCardMetaLabel, getDealDisplayTitle } from '../utils/crm-entity-display';

const DEAL_CARD_AVATAR_BASE_CLASS =
  'relative flex h-8 w-8 items-center justify-center rounded-full border border-border/40 text-[10px] font-bold';

const DEAL_CARD_AVATAR_TONE_CLASS = {
  seller: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  assistant: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
} as const;

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function DealCard({ deal, onClick, onStatusChange }: DealCardProps) {
  const typeVisual = getDealTypePresentation(deal.type);
  const chrome = getDealTypeCardChrome(typeVisual);
  const title = getDealDisplayTitle(deal);
  const metaLabel = getDealCardMetaLabel(deal);
  const showCompany =
    Boolean(deal.company?.name) && metaLabel !== deal.company?.name;
  const deadlineOverdue =
    deal.deadline && deal.status !== 'WON' && deal.status !== 'FAILED'
      ? new Date(deal.deadline).getTime() < Date.now()
      : false;

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
      onClick={() => onClick(deal)}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(TYPE_TINTED_BOARD_CARD_ACCENT_BAR_CLASS, chrome.readinessFillClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">{title}</p>
          {metaLabel ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{metaLabel}</p>
          ) : null}
        </div>
        <DealCardMenu deal={deal} onClick={onClick} onStatusChange={onStatusChange} />
      </div>

      <div
        className={cn(TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS, 'border-border/50 mt-3')}
        aria-hidden
      />

      <DealCardMeta
        deal={deal}
        showCompany={showCompany}
        deadlineOverdue={deadlineOverdue}
        metaIconClass={chrome.metaIconClass}
        typeVisual={typeVisual}
      />

      <DealCardTeamAvatars deal={deal} />
    </KanbanCardShell>
  );
}

function DealCardMeta({
  deal,
  showCompany,
  deadlineOverdue,
  metaIconClass,
  typeVisual,
}: {
  deal: Deal;
  showCompany: boolean;
  deadlineOverdue: boolean;
  metaIconClass: string;
  typeVisual: DealTypePresentation;
}) {
  const linkLabel = deal.existingProduct?.name ?? deal.lead?.code ?? null;
  const LinkIcon = deal.existingProduct ? Puzzle : Link2;

  return (
    <div className={TYPE_TINTED_BOARD_CARD_BODY_STACK_CLASS}>
      {showCompany && deal.company?.name ? (
        <DealMetaLine icon={Building2} label={deal.company.name} metaIconClass={metaIconClass} />
      ) : null}
      {deal.amount != null ? (
        <DealMetaLine
          iconLabel={AMD_CURRENCY_SYMBOL}
          label={formatAmount(deal.amount)}
          metaIconClass={metaIconClass}
          labelClassName={cn(
            TYPE_TINTED_BOARD_CARD_META_LABEL_CLASS,
            'font-semibold tabular-nums',
            typeVisual.amountIconClassName,
          )}
        />
      ) : null}
      {deal.deadline ? (
        <DealMetaLine
          icon={Calendar}
          label={formatBoardCardDate(deal.deadline)}
          metaIconClass={
            deadlineOverdue ? 'bg-destructive/10 text-destructive' : metaIconClass
          }
          labelClassName={
            deadlineOverdue
              ? TYPE_TINTED_BOARD_CARD_DATE_OVERDUE_LABEL_CLASS
              : TYPE_TINTED_BOARD_CARD_DATE_LABEL_CLASS
          }
          iconSize={TYPE_TINTED_BOARD_CARD_DATE_ICON_SIZE}
        />
      ) : null}
      {linkLabel ? (
        <DealMetaLine icon={LinkIcon} label={linkLabel} metaIconClass={metaIconClass} />
      ) : null}
      {deal.paymentType ? (
        <p className="text-muted-foreground text-xs">
          {deal.paymentType.replace(/_/g, ' ')}
        </p>
      ) : null}
    </div>
  );
}

function DealMetaLine({
  icon: Icon,
  iconLabel,
  label,
  metaIconClass,
  labelClassName = TYPE_TINTED_BOARD_CARD_META_LABEL_CLASS,
  iconSize = 14,
}: {
  icon?: LucideIcon;
  iconLabel?: string;
  label: string;
  metaIconClass: string;
  labelClassName?: string;
  iconSize?: number;
}) {
  return (
    <div className={TYPE_TINTED_BOARD_CARD_META_ROW_CLASS}>
      <span className={cn(TYPE_TINTED_BOARD_CARD_META_ICON_BASE_CLASS, metaIconClass)}>
        {Icon ? <Icon size={iconSize} aria-hidden /> : <span aria-hidden>{iconLabel}</span>}
      </span>
      <span className={cn('min-w-0 flex-1', labelClassName)}>{label}</span>
    </div>
  );
}

function DealCardTeamAvatars({ deal }: { deal: Deal }) {
  return (
    <div className="mt-2.5 flex items-center justify-start gap-2">
      <div className="flex shrink-0 -space-x-1.5">
        <DealCardPersonAvatar person={deal.seller} roleLabel="Seller" tone="seller" />
        {deal.sellerAssistant ? (
          <DealCardPersonAvatar
            person={deal.sellerAssistant}
            roleLabel="Assistant"
            tone="assistant"
          />
        ) : null}
      </div>
    </div>
  );
}

function DealCardPersonAvatar({
  person,
  roleLabel,
  tone,
}: {
  person: DealEmployeeRef;
  roleLabel: string;
  tone: keyof typeof DEAL_CARD_AVATAR_TONE_CLASS;
}) {
  const name = employeeFullName(person);
  return (
    <span title={`${roleLabel}: ${name}`}>
      <EmployeePersonAvatar
        label={name}
        imageUrl={person.avatar}
        className={cn(DEAL_CARD_AVATAR_BASE_CLASS, DEAL_CARD_AVATAR_TONE_CLASS[tone])}
      />
    </span>
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
