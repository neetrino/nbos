'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  AI_ADMIN_CARD_CLASS,
  AI_ADMIN_SECTION_BODY_CLASS,
  AI_ADMIN_SECTION_HEADER_CLASS,
} from '../ai-admin-ui.constants';
import { AiAdminIconTile } from './AiAdminIconTile';

export function AiAdminSection(props: {
  icon: LucideIcon;
  title: string;
  description?: string;
  summary?: string;
  actions?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  const body = <div className={AI_ADMIN_SECTION_BODY_CLASS}>{props.children}</div>;

  if (!props.collapsible) {
    return (
      <section className={AI_ADMIN_CARD_CLASS}>
        <AiAdminSectionHeader {...props} />
        {body}
      </section>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={AI_ADMIN_CARD_CLASS}>
      <AiAdminSectionHeader {...props} open={open} collapsible />
      <CollapsibleContent className="overflow-hidden">{body}</CollapsibleContent>
    </Collapsible>
  );
}

function AiAdminSectionHeader(props: {
  icon: LucideIcon;
  title: string;
  description?: string;
  summary?: string;
  actions?: ReactNode;
  collapsible?: boolean;
  open?: boolean;
}) {
  const identity = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <AiAdminIconTile icon={props.icon} size="sm" />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-sm font-semibold tracking-tight">{props.title}</h2>
          {props.summary ? (
            <span className="text-muted-foreground text-xs">{props.summary}</span>
          ) : null}
        </div>
        {props.description && (!props.collapsible || props.open) ? (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{props.description}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <header className={AI_ADMIN_SECTION_HEADER_CLASS}>
      {props.collapsible ? (
        <CollapsibleTrigger className="hover:bg-muted/40 -mx-1 flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1 text-left outline-none select-none">
          {identity}
          <ChevronDown
            className={cn(
              'text-muted-foreground mt-1 size-4 shrink-0 transition-transform',
              props.open && 'rotate-180',
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
      ) : (
        identity
      )}
      {props.actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {props.actions}
        </div>
      ) : null}
    </header>
  );
}
