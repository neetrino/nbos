import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge, type StatusVariant } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  AI_ADMIN_CARD_CLASS,
  AI_ADMIN_CARD_INTERACTIVE_CLASS,
  AI_ADMIN_FOOTER_BAR_CLASS,
} from '../ai-admin-ui.constants';
import { AiAdminIconTile } from './AiAdminIconTile';
import { AiAdminMetricPill } from './AiAdminMetricPill';

export type AiAdminEntityPill = {
  icon: LucideIcon;
  text: string;
};

export function AiAdminEntityRow(props: {
  icon: LucideIcon;
  glyph?: ReactNode;
  title: string;
  description?: string | null;
  href?: string;
  statusLabel?: string;
  statusVariant?: StatusVariant;
  pills?: AiAdminEntityPill[];
  footer?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        <AiAdminIconTile icon={props.icon} glyph={props.glyph} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-foreground truncate text-sm font-semibold tracking-tight">
                {props.title}
              </h2>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                {props.description?.trim() || 'No purpose recorded'}
              </p>
            </div>
            {props.statusLabel ? (
              <StatusBadge
                label={props.statusLabel}
                variant={props.statusVariant}
                dot
                className="shrink-0 rounded-full"
              />
            ) : null}
          </div>
          {props.pills && props.pills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {props.pills.map((pill) => (
                <AiAdminMetricPill key={pill.text} icon={pill.icon} text={pill.text} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {props.footer ? <div className={AI_ADMIN_FOOTER_BAR_CLASS}>{props.footer}</div> : null}
    </>
  );

  const className = cn(
    AI_ADMIN_CARD_CLASS,
    'flex h-full flex-col p-4',
    props.href ? AI_ADMIN_CARD_INTERACTIVE_CLASS : null,
  );

  if (props.href) {
    return (
      <Link href={props.href} className={className}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}
