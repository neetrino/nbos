'use client';

import {
  Check,
  FolderKanban,
  Handshake,
  Layers,
  Loader2,
  Search,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import {
  SVYAZAT_KIND_LABELS,
  type SvyazatSearchHit,
  type SvyazatSearchKind,
} from './lead-svyazat-search';

const KIND_ICONS = {
  contact: User,
  deal: Handshake,
  project: FolderKanban,
  product: Layers,
  lead: UserRound,
} as const satisfies Record<SvyazatSearchKind, typeof User>;

const HIT_LIST_CLASS =
  'border-border/60 bg-popover max-h-64 overflow-y-auto rounded-xl border shadow-sm';

interface LeadSvyazatPickerListProps {
  query: string;
  hits: SvyazatSearchHit[];
  selectedId: string | null;
  loading: boolean;
  placeholder: string;
  searchLabel: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onApply: () => void;
}

export function LeadSvyazatPickerList(props: LeadSvyazatPickerListProps) {
  return (
    <div className="space-y-3">
      <LeadSvyazatSearchField
        query={props.query}
        placeholder={props.placeholder}
        searchLabel={props.searchLabel}
        onQueryChange={props.onQueryChange}
      />
      {props.loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 size={13} className="animate-spin" />
          {LEAD_SVYAZAT_LABELS.searching}
        </p>
      ) : null}
      <div className={HIT_LIST_CLASS} role="listbox" aria-label={props.searchLabel}>
        <LeadSvyazatHitList
          query={props.query}
          hits={props.hits}
          selectedId={props.selectedId}
          loading={props.loading}
          onSelect={props.onSelect}
          onApply={props.onApply}
        />
      </div>
    </div>
  );
}

function LeadSvyazatSearchField(props: {
  query: string;
  placeholder: string;
  searchLabel: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        id="lead-svyazat-search"
        value={props.query}
        onChange={(event) => props.onQueryChange(event.target.value)}
        placeholder={props.placeholder}
        autoComplete="off"
        aria-label={props.searchLabel}
        className="pr-9 pl-9"
      />
      {props.query ? (
        <button
          type="button"
          onClick={() => props.onQueryChange('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

function LeadSvyazatHitList(props: {
  query: string;
  hits: SvyazatSearchHit[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onApply: () => void;
}) {
  if (!props.loading && props.hits.length === 0) {
    return (
      <p className="text-muted-foreground px-3 py-6 text-center text-xs">
        {props.query.trim() ? LEAD_SVYAZAT_LABELS.emptySearch : LEAD_SVYAZAT_LABELS.emptyRecent}
      </p>
    );
  }

  return (
    <>
      {props.hits.map((hit) => (
        <LeadSvyazatHitButton
          key={hit.id}
          hit={hit}
          selected={props.selectedId === hit.id}
          onSelect={props.onSelect}
          onApply={props.onApply}
        />
      ))}
    </>
  );
}

function LeadSvyazatHitButton(props: {
  hit: SvyazatSearchHit;
  selected: boolean;
  onSelect: (id: string) => void;
  onApply: () => void;
}) {
  const Icon = KIND_ICONS[props.hit.kind];
  return (
    <button
      type="button"
      role="option"
      aria-selected={props.selected}
      onClick={() => props.onSelect(props.hit.id)}
      onDoubleClick={props.onApply}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
        props.selected ? 'bg-sky-50 dark:bg-sky-950/30' : 'hover:bg-muted',
      )}
    >
      <span className="text-muted-foreground bg-muted/60 size-8 shrink-0 rounded-lg p-1.5">
        <Icon size={16} className="mx-auto" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {SVYAZAT_KIND_LABELS[props.hit.kind]}
        </p>
        <p className="text-foreground truncate text-sm font-medium">{props.hit.title}</p>
        {props.hit.subtitle ? (
          <p className="text-muted-foreground truncate text-[11px]">{props.hit.subtitle}</p>
        ) : null}
      </div>
      {props.selected ? (
        <Check size={16} className="shrink-0 text-sky-600 dark:text-sky-400" />
      ) : null}
    </button>
  );
}
