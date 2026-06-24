'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  NbosDatePicker,
  type NbosDatePickerMode,
  type NbosDatePickerVariant,
} from '@/components/shared/date-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_FIELD_LEADING_ICON_CLASS,
  DETAIL_SHEET_FIELD_EXTERNAL_ICON_ROW_CLASS,
  DETAIL_SHEET_FIELD_SHELL_CLASS,
  DETAIL_SHEET_SELECT_TRIGGER_IN_SHELL_CLASS,
} from './detail-sheet-classes';
import { resolveSelectOptionLabel } from './select-option-label';
import { MoneyInput } from './MoneyInput';

type FieldType =
  | 'text'
  | 'number'
  | 'money'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'link'
  | 'date';

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface ControlledInlineFieldProps {
  variant: 'controlled';
  label: string;
  value: string | number | null | undefined;
  onValueChange: (value: string) => void;
  type?: FieldType;
  options?: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
  suffix?: string;
  className?: string;
  clearable?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  datePickerVariant?: NbosDatePickerVariant;
  datePickerMode?: NbosDatePickerMode;
  /** Select dropdown item styling (`highlight` = blue selected, gray hover, no checkmark). */
  selectMenuTone?: 'default' | 'highlight';
  /** Field shell width follows content (select, money). */
  fitContent?: boolean;
}

export function ControlledInlineField({
  label,
  value,
  onValueChange,
  type = 'text',
  options,
  placeholder,
  icon,
  suffix,
  className,
  clearable = false,
  disabled = false,
  hideLabel = false,
  datePickerVariant = 'compact',
  datePickerMode = 'date',
  fitContent = false,
  selectMenuTone = 'default',
}: ControlledInlineFieldProps) {
  const str = value != null && value !== '' ? String(value) : '';
  const showClear = clearable && str !== '' && !disabled;
  const externalIcon =
    hideLabel && icon ? (
      <span className={DETAIL_SHEET_FIELD_LEADING_ICON_CLASS} aria-hidden>
        {icon}
      </span>
    ) : null;

  const wrapShell = (
    shellClassName: string,
    content: ReactNode,
    align: 'center' | 'start' = 'center',
  ) => {
    if (externalIcon) {
      return (
        <div
          className={cn(
            DETAIL_SHEET_FIELD_EXTERNAL_ICON_ROW_CLASS,
            align === 'start' ? 'items-start' : 'items-center',
          )}
        >
          {externalIcon}
          <div className={cn('min-w-0 flex-1', shellClassName)}>{content}</div>
        </div>
      );
    }
    return <div className={shellClassName}>{content}</div>;
  };

  const clearButton = showClear ? (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={() => onValueChange('')}
      disabled={disabled}
      className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
      aria-label={`Clear ${label}`}
    >
      <X size={16} />
    </button>
  ) : null;

  return (
    <div
      className={cn(
        'group relative',
        disabled && 'pointer-events-none opacity-60',
        fitContent && 'w-fit shrink-0',
        className,
      )}
    >
      {hideLabel ? null : (
        <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
          {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
          {label}
        </div>
      )}

      {type === 'select' && options
        ? wrapShell(
            cn(DETAIL_SHEET_FIELD_SHELL_CLASS, fitContent && 'w-auto'),
            <>
              <Select
                value={str}
                onValueChange={(v) => {
                  if (v == null || v === '') {
                    onValueChange('');
                    return;
                  }
                  onValueChange(v);
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  size="sm"
                  className={cn(
                    DETAIL_SHEET_SELECT_TRIGGER_IN_SHELL_CLASS,
                    fitContent && 'w-auto',
                    showClear && 'pr-1',
                  )}
                >
                  <SelectValue
                    placeholder={placeholder ?? 'Select...'}
                    className={fitContent ? 'flex-none' : undefined}
                  >
                    {(selected: string | null) =>
                      selected ? resolveSelectOptionLabel(selected, options) : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} tone={selectMenuTone}>
                      <span className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clearButton}
            </>,
          )
        : type === 'textarea'
          ? wrapShell(
              cn(DETAIL_SHEET_FIELD_SHELL_CLASS, 'min-h-[88px] items-start py-2'),
              <Textarea
                value={str}
                onChange={(e) => onValueChange(e.target.value)}
                rows={3}
                disabled={disabled}
                className={cn(
                  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
                  'max-h-none min-h-[72px] resize-none py-1 text-sm',
                )}
                placeholder={placeholder}
                aria-label={label}
              />,
              'start',
            )
          : type === 'date'
            ? wrapShell(
                DETAIL_SHEET_FIELD_SHELL_CLASS,
                <NbosDatePicker
                  value={str}
                  onChange={onValueChange}
                  variant={datePickerVariant}
                  mode={datePickerMode}
                  disabled={disabled}
                  clearable={clearable}
                  placeholder={placeholder ?? 'Select date…'}
                  embedded
                  className="min-w-0 flex-1"
                  aria-label={label}
                />,
              )
            : type === 'money'
              ? wrapShell(
                  cn(DETAIL_SHEET_FIELD_SHELL_CLASS, fitContent && 'w-auto'),
                  <>
                    <MoneyInput
                      value={str}
                      onChange={onValueChange}
                      disabled={disabled}
                      className={cn(
                        DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
                        'min-w-0 truncate text-sm tabular-nums',
                        fitContent && 'w-auto flex-none',
                      )}
                      placeholder={placeholder}
                    />
                    {suffix && str !== '' ? (
                      <span className="text-muted-foreground shrink-0 text-xs">{suffix}</span>
                    ) : null}
                  </>,
                )
              : wrapShell(
                  DETAIL_SHEET_FIELD_SHELL_CLASS,
                  <>
                    <Input
                      type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
                      value={str}
                      onChange={(e) => onValueChange(e.target.value)}
                      disabled={disabled}
                      className={cn(DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS, 'text-sm')}
                      placeholder={placeholder}
                      aria-label={label}
                    />
                    {suffix && str !== '' ? (
                      <span className="text-muted-foreground shrink-0 text-xs">{suffix}</span>
                    ) : null}
                  </>,
                )}
    </div>
  );
}
