import type { ReactNode } from 'react';
import { Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS,
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
} from './detail-sheet-classes';

export type SearchOption = {
  value: string;
  label: string;
  subtitle?: string;
  leading?: ReactNode;
};

export function SearchFieldOptionButton(props: {
  option: SearchOption;
  highlighted: boolean;
  saving: boolean;
  onSelect: (value: string, label: string) => void;
}) {
  const { option } = props;
  return (
    <button
      type="button"
      onClick={() => props.onSelect(option.value, option.label)}
      className={cn(
        'hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
        props.highlighted && 'bg-muted',
        props.saving && 'pointer-events-none opacity-50',
      )}
    >
      {option.leading ? <span className="shrink-0">{option.leading}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{option.label}</p>
        {option.subtitle ? (
          <p className="text-muted-foreground truncate text-[11px]">{option.subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}

function SearchFieldClosedClearButton(props: {
  label: string;
  saving: boolean;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        props.onClear();
      }}
      disabled={props.saving}
      className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
      aria-label={`Clear ${props.label}`}
    >
      <X size={16} />
    </button>
  );
}

export function SearchFieldClosedValue(props: {
  label: string;
  value: string | null | undefined;
  displayValue?: ReactNode;
  placeholder?: string;
  hasValue: boolean;
  disabled: boolean;
  saving: boolean;
  newBadge?: ReactNode;
  onOpen: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        onClick={() => {
          if (!props.disabled) props.onOpen();
        }}
        className={cn(
          DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
          DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
          'text-foreground flex-1 rounded-xl px-3 py-2 text-sm',
          props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {props.displayValue ??
              (props.hasValue ? (
                <span className="text-foreground">{props.value}</span>
              ) : (
                <span className="text-muted-foreground">{props.placeholder ?? 'Not set'}</span>
              ))}
          </div>
          <div className="flex items-center gap-1">
            {props.onClear && props.hasValue ? (
              <SearchFieldClosedClearButton
                label={props.label}
                saving={props.saving}
                onClear={props.onClear}
              />
            ) : null}
            <Pencil size={16} className={DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS} aria-hidden />
          </div>
        </div>
      </div>
      {props.newBadge}
    </div>
  );
}
