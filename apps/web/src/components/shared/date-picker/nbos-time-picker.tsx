'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));
const TIME_COLUMN_CLASS =
  'flex max-h-44 w-9 flex-col gap-0.5 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const TIME_OPTION_CLASS =
  'flex h-7 w-full shrink-0 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors';

function parseTimeParts(value: string): { hour: string; minute: string } {
  const [hourPart, minutePart] = value.split(':');
  const hour = HOUR_OPTIONS.includes(hourPart ?? '') ? (hourPart as string) : '19';
  const minute = MINUTE_OPTIONS.includes(minutePart ?? '') ? (minutePart as string) : '00';
  return { hour, minute };
}

export interface NbosTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function NbosTimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: NbosTimePickerProps) {
  const [open, setOpen] = useState(false);
  const { hour, minute } = useMemo(() => parseTimeParts(value), [value]);

  const commit = (nextHour: string, nextMinute: string) => {
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'border-border/60 bg-muted/20 text-foreground hover:bg-muted/35 inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-2.5 text-left text-sm font-medium shadow-none transition-colors',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        aria-label={`Time ${hour}:${minute}`}
      >
        <Clock size={16} className="text-primary shrink-0" aria-hidden />
        <span className="tabular-nums">
          {hour}:{minute}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={6}
        className="border-border bg-popover w-auto min-w-0 rounded-xl p-1 shadow-xl"
      >
        <div className="flex items-center gap-0.5" role="group" aria-label="Select time">
          <TimeColumn
            label="Hours"
            options={HOUR_OPTIONS}
            selected={hour}
            onSelect={(nextHour) => commit(nextHour, minute)}
          />
          <TimeColumn
            label="Minutes"
            options={MINUTE_OPTIONS}
            selected={minute}
            onSelect={(nextMinute) => commit(hour, nextMinute)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const option = selectedRef.current;
    if (!list || !option) return;
    list.scrollTop = option.offsetTop - list.clientHeight / 2 + option.clientHeight / 2;
  }, [selected]);

  return (
    <div ref={listRef} className={TIME_COLUMN_CLASS} role="listbox" aria-label={label}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <button
            key={option}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(option)}
            className={cn(
              TIME_OPTION_CLASS,
              isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
