'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NbosDatePicker, type NbosDatePickerVariant } from '@/components/shared/date-picker';
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
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
} from './detail-sheet-classes';
import { resolveSelectOptionLabel } from './select-option-label';

type FieldType = 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'link' | 'date';

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
  datePickerVariant?: NbosDatePickerVariant;
}

const FIELD_SHELL_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  'border-border/60 bg-muted/20 flex w-full min-h-10 items-center gap-1 rounded-xl border px-3 py-1.5 shadow-sm shadow-black/[0.04] transition-[border-color,background-color]',
);

const INNER_CONTROL_CLASS =
  'h-8 min-h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0';

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
  datePickerVariant = 'compact',
}: ControlledInlineFieldProps) {
  const str = value != null && value !== '' ? String(value) : '';
  const showClear = clearable && str !== '' && !disabled;

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
    <div className={cn('group relative', disabled && 'pointer-events-none opacity-60', className)}>
      <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
        {label}
      </div>

      {type === 'select' && options ? (
        <div className={FIELD_SHELL_CLASS}>
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
            <SelectTrigger className={cn(INNER_CONTROL_CLASS, showClear && 'pr-1')}>
              <SelectValue placeholder={placeholder ?? 'Select...'}>
                {(selected: string | null) =>
                  selected ? resolveSelectOptionLabel(selected, options) : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {clearButton}
        </div>
      ) : type === 'textarea' ? (
        <div className={cn(FIELD_SHELL_CLASS, 'min-h-[88px] items-start py-2')}>
          <Textarea
            value={str}
            onChange={(e) => onValueChange(e.target.value)}
            rows={3}
            disabled={disabled}
            className={cn(INNER_CONTROL_CLASS, 'min-h-[72px] resize-none py-1 text-sm')}
            placeholder={placeholder}
          />
        </div>
      ) : type === 'date' ? (
        <div className={FIELD_SHELL_CLASS}>
          <NbosDatePicker
            value={str}
            onChange={onValueChange}
            variant={datePickerVariant}
            disabled={disabled}
            clearable={clearable}
            placeholder={placeholder ?? 'Select date…'}
            embedded
            className="min-w-0 flex-1"
            aria-label={label}
          />
        </div>
      ) : (
        <div className={FIELD_SHELL_CLASS}>
          <Input
            type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
            value={str}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className={cn(INNER_CONTROL_CLASS, 'text-sm')}
            placeholder={placeholder}
          />
          {suffix && str !== '' ? (
            <span className="text-muted-foreground shrink-0 text-xs">{suffix}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
