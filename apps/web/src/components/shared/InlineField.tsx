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

type FieldType = 'text' | 'number' | 'email' | 'phone' | 'textarea' | 'select' | 'link' | 'date';

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface InlineFieldProps {
  label: string;
  value: string | number | null | undefined;
  displayValue?: ReactNode;
  type?: FieldType;
  options?: SelectOption[];
  placeholder?: string;
  editable?: boolean;
  onSave?: (value: string) => Promise<void> | void;
  icon?: ReactNode;
  suffix?: string;
  className?: string;
}

export function InlineField({
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
}: InlineFieldProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayStr = value != null && value !== '' ? String(value) : null;

  return (
    <div className={cn('group relative', className)}>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </div>

      {editing ? (
        <div className="flex items-start gap-1.5">
          {type === 'select' && options ? (
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
                <SelectValue placeholder={placeholder ?? 'Select...'} />
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
          ) : (
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type={
                type === 'number'
                  ? 'number'
                  : type === 'email'
                    ? 'email'
                    : type === 'date'
                      ? 'date'
                      : 'text'
              }
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
                className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-1.5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={editable && onSave ? startEdit : undefined}
          className={cn(
            'rounded-lg px-3 py-2 text-sm transition-all',
            editable && onSave
              ? 'hover:bg-accent/5 hover:border-border cursor-pointer border border-transparent'
              : 'cursor-default',
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
              <Pencil
                size={12}
                className="text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
