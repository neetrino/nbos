'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
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
}: ControlledInlineFieldProps) {
  const str = value != null && value !== '' ? String(value) : '';

  return (
    <div className={cn('group relative', className)}>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </div>

      <div className="flex items-start gap-1.5">
        {type === 'select' && options ? (
          <>
            <Select
              value={str || undefined}
              onValueChange={(v) => {
                if (typeof v === 'string' && v !== '') onValueChange(v);
              }}
              disabled={disabled}
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
            {clearable && str !== '' && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => onValueChange('')}
                disabled={disabled}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
                aria-label={`Clear ${label}`}
              >
                <X size={16} />
              </button>
            )}
          </>
        ) : type === 'textarea' ? (
          <Textarea
            value={str}
            onChange={(e) => onValueChange(e.target.value)}
            rows={3}
            disabled={disabled}
            className="min-h-[72px] text-sm"
            placeholder={placeholder}
          />
        ) : (
          <Input
            type={
              type === 'number'
                ? 'number'
                : type === 'email'
                  ? 'email'
                  : type === 'date'
                    ? 'date'
                    : 'text'
            }
            value={str}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
            placeholder={placeholder}
          />
        )}

        {suffix && str !== '' && type !== 'textarea' && (
          <span className="text-muted-foreground mt-1.5 shrink-0 text-xs">{suffix}</span>
        )}
      </div>
    </div>
  );
}
