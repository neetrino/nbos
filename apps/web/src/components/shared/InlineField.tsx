'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { ControlledInlineField } from './ControlledInlineField';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS,
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
} from './detail-sheet-classes';
import { resolveSelectOptionLabel } from './select-option-label';

type FieldType = 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'link' | 'date';

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

type InlineFieldInlineProps = {
  variant?: 'inline' | undefined;
  label: string;
  value: string | number | null | undefined;
  displayValue?: ReactNode;
  type?: FieldType;
  options?: SelectOption[];
  placeholder?: string;
  editable?: boolean;
  onSave?: (value: string | null) => Promise<void> | void;
  icon?: ReactNode;
  suffix?: string;
  className?: string;
  clearable?: boolean;
};

type InlineFieldControlledProps = {
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
  datePickerVariant?: 'compact' | 'extended';
  datePickerMode?: 'date' | 'datetime';
};

export type InlineFieldProps = InlineFieldInlineProps | InlineFieldControlledProps;

function InlineFieldUncontrolled({
  label,
  value,
  displayValue,
  type = 'text',
  options,
  placeholder,
  editable = true,
  onSave,
  icon,
  suffix,
  className,
  clearable = false,
}: InlineFieldInlineProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = () => {
    if (!editable || !onSave) return;
    setEditValue(String(value ?? ''));
    setEditing(true);
    if (type === 'select') {
      setSelectOpen(true);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(String(value ?? ''));
  };

  const handleClear = async () => {
    if (!onSave) return;
    setSaving(true);
    setEditing(false);
    setEditValue('');
    try {
      await onSave(null);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const rawDisplayStr = value != null && value !== '' ? String(value) : null;
  const displayStr =
    rawDisplayStr && type === 'select' && options
      ? resolveSelectOptionLabel(rawDisplayStr, options)
      : rawDisplayStr;

  return (
    <div className={cn('group relative', className)}>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </div>

      {editing ? (
        <div className="flex items-start gap-1.5">
          {type === 'select' && options ? (
            <>
              <Select
                open={selectOpen}
                onOpenChange={(open) => {
                  setSelectOpen(open);
                  if (!open) setEditing(false);
                }}
                value={editValue || undefined}
                onValueChange={(v) => {
                  if (v === null) return;
                  setEditValue(v);
                  setSelectOpen(false);
                  if (onSave) {
                    setSaving(true);
                    Promise.resolve(onSave(v)).then(() => {
                      setEditing(false);
                      setSaving(false);
                    });
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full text-sm">
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
              {clearable && (
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleClear}
                  disabled={saving}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-8 items-center justify-center rounded-md transition-colors"
                  aria-label={`Clear ${label}`}
                >
                  <X size={16} />
                </button>
              )}
            </>
          ) : type === 'textarea' ? (
            <Textarea
              ref={inputRef as React.Ref<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="min-h-[72px] text-sm"
              placeholder={placeholder}
            />
          ) : type === 'date' ? (
            <NbosDatePicker
              value={editValue}
              onChange={setEditValue}
              placeholder={placeholder ?? 'Select date…'}
              className="min-w-0 flex-1"
              aria-label={label}
            />
          ) : (
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              placeholder={placeholder}
            />
          )}

          {type !== 'select' && (
            <div className="flex shrink-0 gap-0.5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex size-8 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-500/10"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-8 items-center justify-center rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={editable && onSave ? startEdit : undefined}
          className={cn(
            DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
            DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
            'rounded-xl px-3 py-2 text-sm',
            editable && onSave ? 'cursor-pointer' : 'cursor-default',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {displayValue ?? (
                <span className={displayStr ? 'text-foreground' : 'text-muted-foreground'}>
                  {displayStr ?? placeholder ?? 'Not set'}
                </span>
              )}
              {suffix && displayStr && (
                <span className="text-muted-foreground text-xs">{suffix}</span>
              )}
            </div>
            {editable && onSave && (
              <div className="flex items-center gap-1">
                {clearable && displayStr && (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                    disabled={saving}
                    className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
                    aria-label={`Clear ${label}`}
                  >
                    <X size={16} />
                  </button>
                )}
                <Pencil size={16} className={DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS} aria-hidden />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InlineField(props: InlineFieldProps) {
  if (props.variant === 'controlled') {
    const { datePickerVariant, datePickerMode, ...controlledProps } = props;
    return (
      <ControlledInlineField
        {...controlledProps}
        datePickerVariant={datePickerVariant}
        datePickerMode={datePickerMode}
      />
    );
  }
  return <InlineFieldUncontrolled {...props} />;
}
