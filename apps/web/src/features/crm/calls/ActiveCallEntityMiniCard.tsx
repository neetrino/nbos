'use client';

import type { LucideIcon } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import {
  TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS,
  TYPE_TINTED_BOARD_CARD_SHELL_CLASS,
} from '@/components/shared/kanban/type-tinted-board-card-ui.constants';
import { cn } from '@/lib/utils';
import {
  ACTIVE_CALL_MINI_ACCENT_BAR_CLASS,
  ACTIVE_CALL_MINI_META_ICON_CLASS,
  ACTIVE_CALL_MINI_META_ICON_SIZE,
} from './active-call.constants';

export type ActiveCallMiniCardLine = {
  icon: LucideIcon;
  label: string;
};

export function ActiveCallEntityMiniCard(props: {
  title: string;
  subtitle: string | null;
  accentClassName: string;
  metaIconClassName: string;
  lines: ActiveCallMiniCardLine[];
}) {
  const { title, subtitle, accentClassName, metaIconClassName, lines } = props;

  return (
    <KanbanCardShell
      as="section"
      preset="crm"
      padding="compact"
      radius="xl"
      baseShadow="sm"
      hoverShadow={false}
      transition="colors"
      shellClassName={TYPE_TINTED_BOARD_CARD_SHELL_CLASS}
    >
      <div className="flex items-start gap-2">
        <span className={cn(ACTIVE_CALL_MINI_ACCENT_BAR_CLASS, accentClassName)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold">{title}</p>
          {subtitle ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {lines.length > 0 ? (
        <MiniCardMeta lines={lines} metaIconClassName={metaIconClassName} />
      ) : null}
    </KanbanCardShell>
  );
}

function MiniCardMeta(props: { lines: ActiveCallMiniCardLine[]; metaIconClassName: string }) {
  return (
    <>
      <div
        className={cn(TYPE_TINTED_BOARD_CARD_DIVIDER_BASE_CLASS, 'border-border/50 mt-2')}
        aria-hidden
      />
      <div className="flex flex-col gap-1.5 pt-2">
        {props.lines.map((line) => (
          <MiniCardLineRow
            key={line.label}
            line={line}
            metaIconClassName={props.metaIconClassName}
          />
        ))}
      </div>
    </>
  );
}

function MiniCardLineRow(props: { line: ActiveCallMiniCardLine; metaIconClassName: string }) {
  const Icon = props.line.icon;
  return (
    <div className="flex items-center gap-2">
      <span className={cn(ACTIVE_CALL_MINI_META_ICON_CLASS, props.metaIconClassName)}>
        <Icon size={ACTIVE_CALL_MINI_META_ICON_SIZE} aria-hidden />
      </span>
      <span className="text-foreground min-w-0 truncate text-xs leading-snug">
        {props.line.label}
      </span>
    </div>
  );
}
