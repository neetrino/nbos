'use client';

import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import type { CompanyLookupFillTarget } from './apply-company-lookup-fill';
import { CompanyLookupLoadingPanel, CompanyLookupMatchList } from './CompanyLookupMatchList';
import { useCompanyArmeniaLookup } from './use-company-armenia-lookup';

const ARMENIA_LOOKUP_QUERY_MIN_LENGTH = 2;

interface CompanyArmeniaLookupProps {
  disabled?: boolean;
  current: CompanyLookupFillTarget;
  onApply: (next: CompanyLookupFillTarget) => void;
}

export function CompanyArmeniaLookup({ disabled, current, onApply }: CompanyArmeniaLookupProps) {
  const lookup = useCompanyArmeniaLookup(current, onApply);
  const showNotice = Boolean(lookup.notice) && !lookup.error && lookup.matches.length === 0;

  return (
    <div className={cn(DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS, 'z-20')}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Armenian registry</span>
      <div className="relative">
        <ArmeniaLookupSearchField
          query={lookup.query}
          loading={lookup.loading}
          disabled={disabled}
          canDismiss={lookup.matches.length > 0}
          onQueryChange={lookup.setQuery}
          onSearch={() => void lookup.runSearch()}
          onDismiss={lookup.dismissMatches}
        />
        {lookup.loading ? <CompanyLookupLoadingPanel /> : null}
        {lookup.matches.length > 0 ? (
          <CompanyLookupMatchList
            items={lookup.matches}
            disabled={disabled}
            onFill={lookup.applyMatch}
          />
        ) : null}
      </div>
      {lookup.error ? (
        <p className="text-destructive mt-1 text-xs" role="alert">
          {lookup.error}
        </p>
      ) : null}
      {showNotice ? <p className="text-muted-foreground mt-1 text-xs">{lookup.notice}</p> : null}
    </div>
  );
}

function ArmeniaLookupSearchField({
  query,
  loading,
  disabled,
  canDismiss,
  onQueryChange,
  onSearch,
  onDismiss,
}: {
  query: string;
  loading: boolean;
  disabled?: boolean;
  canDismiss: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onDismiss: () => void;
}) {
  const canSearch = !disabled && query.trim().length >= ARMENIA_LOOKUP_QUERY_MIN_LENGTH;

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS}>
      <Input
        value={query}
        disabled={disabled || loading}
        placeholder="TIN / ՀՎՀՀ or Armenian company name"
        aria-label="Armenian registry"
        aria-busy={loading}
        className={cn(DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS, 'text-sm')}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !canSearch || loading) return;
          e.preventDefault();
          onSearch();
        }}
      />
      {canDismiss ? <ArmeniaLookupDismissButton onDismiss={onDismiss} /> : null}
      <ArmeniaLookupSearchButton loading={loading} disabled={!canSearch} onSearch={onSearch} />
    </div>
  );
}

const LOOKUP_FIELD_ICON_BTN_CLASS =
  'text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md';

function ArmeniaLookupDismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      aria-label="Dismiss registry matches"
      className={LOOKUP_FIELD_ICON_BTN_CLASS}
      onClick={onDismiss}
    >
      <X size={14} />
    </button>
  );
}

function ArmeniaLookupSearchButton({
  loading,
  disabled,
  onSearch,
}: {
  loading: boolean;
  disabled: boolean;
  onSearch: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Search Armenian registry"
      className={cn(LOOKUP_FIELD_ICON_BTN_CLASS, !loading && 'disabled:opacity-40')}
      onClick={onSearch}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
    </button>
  );
}
