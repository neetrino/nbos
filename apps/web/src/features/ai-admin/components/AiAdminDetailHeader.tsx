'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, type LucideIcon } from 'lucide-react';
import { StatusBadge, type StatusVariant } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AI_ADMIN_CARD_CLASS,
  AI_ADMIN_FOOTER_BAR_CLASS,
  AI_ADMIN_META_STRIP_CLASS,
} from '../ai-admin-ui.constants';
import { AiAdminIconTile } from './AiAdminIconTile';

export function AiAdminDetailHeader(props: {
  icon: LucideIcon;
  name: string;
  purpose: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  readOnly?: boolean;
  onNameCommit?: (name: string) => void;
  onPurposeCommit?: (purpose: string) => void;
  actions?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  if (props.compact) {
    return <CompactAiAdminDetailHeader {...props} />;
  }
  return <StandardAiAdminDetailHeader {...props} />;
}

function CompactAiAdminDetailHeader(props: {
  icon: LucideIcon;
  name: string;
  purpose: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  readOnly?: boolean;
  onNameCommit?: (name: string) => void;
  onPurposeCommit?: (purpose: string) => void;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className={cn(AI_ADMIN_CARD_CLASS, 'p-4')}>
      <div className="grid items-stretch gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,34%)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            <AiAdminIconTile icon={props.icon} />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
              {props.readOnly || !props.onNameCommit ? (
                <h1 className="truncate text-lg font-semibold tracking-tight">{props.name}</h1>
              ) : (
                <EditableName
                  name={props.name}
                  onCommit={props.onNameCommit}
                  className="text-lg font-semibold tracking-tight"
                />
              )}
              <StatusBadge
                label={props.statusLabel}
                variant={props.statusVariant}
                dot
                className="shrink-0 self-center rounded-full"
              />
            </div>
          </div>
          {props.meta}
          {props.actions ? (
            <div className="border-border/60 mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
              {props.actions}
            </div>
          ) : null}
        </div>
        <PurposeField
          readOnly={props.readOnly ?? false}
          purpose={props.purpose}
          onCommit={props.onPurposeCommit}
        />
      </div>
    </section>
  );
}

function StandardAiAdminDetailHeader(props: {
  icon: LucideIcon;
  name: string;
  purpose: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className={cn(AI_ADMIN_CARD_CLASS, 'p-4 sm:p-5')}>
      {props.backHref && props.backLabel ? (
        <Link
          href={props.backHref}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {props.backLabel}
        </Link>
      ) : null}

      <div className="flex items-start gap-4">
        <AiAdminIconTile icon={props.icon} size="lg" className="hidden sm:flex" />
        <AiAdminIconTile icon={props.icon} size="md" className="sm:hidden" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{props.name}</h1>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {props.purpose || 'No purpose recorded'}
              </p>
            </div>
            <StatusBadge
              label={props.statusLabel}
              variant={props.statusVariant}
              dot
              className="shrink-0 self-center rounded-full"
            />
          </div>
        </div>
      </div>

      {props.meta ? <div className={AI_ADMIN_META_STRIP_CLASS}>{props.meta}</div> : null}
      {props.actions ? (
        <div className={cn(AI_ADMIN_FOOTER_BAR_CLASS, 'justify-between')}>{props.actions}</div>
      ) : null}
    </section>
  );
}

function PurposeField(props: {
  readOnly: boolean;
  purpose: string;
  onCommit?: (purpose: string) => void;
}) {
  return (
    <fieldset className="border-border/60 flex h-full min-h-[8.5rem] min-w-0 flex-col rounded-xl border px-3 pb-2.5">
      <legend className="text-muted-foreground px-1 text-xs font-medium">Purpose</legend>
      {props.readOnly || !props.onCommit ? (
        <p className="text-muted-foreground flex-1 px-0.5 text-sm leading-relaxed">
          {props.purpose || 'No purpose recorded'}
        </p>
      ) : (
        <Textarea
          aria-label="Purpose"
          defaultValue={props.purpose}
          placeholder="What is this agent for?"
          className="min-h-[5.5rem] flex-1 resize-none border-0 bg-transparent px-0.5 shadow-none focus-visible:ring-0"
          onBlur={(event) => {
            const purpose = event.target.value.trim();
            if (purpose === props.purpose) return;
            props.onCommit?.(purpose);
          }}
        />
      )}
    </fieldset>
  );
}

function EditableName(props: {
  name: string;
  onCommit: (name: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.name);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === props.name) {
      setDraft(props.name);
      return;
    }
    props.onCommit(next);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        aria-label="Name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className={cn(
          'h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0',
          props.className,
        )}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(props.name);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="group inline-flex max-w-full min-w-0 items-center gap-2 text-left"
      onClick={() => {
        setDraft(props.name);
        setEditing(true);
      }}
    >
      <span className={cn('truncate', props.className)}>{props.name}</span>
      <Pencil
        className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}
