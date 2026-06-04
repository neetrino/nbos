'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AssigneeOption {
  value: string;
  label: string;
  subtitle?: string;
  avatar?: string;
}

interface QuickCreateTaskAssigneePickerProps {
  assigneeId: string;
  assigneeLabel: string;
  assigneeAvatar?: string;
  disabled?: boolean;
  onSearch: (query: string) => Promise<AssigneeOption[]>;
  onSelect: (id: string, label: string, avatar?: string) => void;
}

const ASSIGNEE_AVATAR_TRIGGER_CLASS = 'size-6 rounded-full text-[10px]';
const ASSIGNEE_AVATAR_OPTION_CLASS = 'size-7 rounded-full text-[10px]';

export function QuickCreateTaskAssigneePicker({
  assigneeId,
  assigneeLabel,
  assigneeAvatar,
  disabled = false,
  onSearch,
  onSelect,
}: QuickCreateTaskAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const runSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const items = await onSearch(q);
          setResults(items.slice(0, 8));
        } finally {
          setLoading(false);
        }
      }, 150);
    },
    [onSearch],
  );

  useEffect(() => {
    if (!open) return;
    runSearch('');
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      clearTimeout(timer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, runSearch]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setQuery('');
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const hasAssignee = Boolean(assigneeId && assigneeLabel);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'text-foreground flex w-full min-w-0 items-center gap-2 rounded-md py-0.5 text-left text-sm transition-colors',
          'hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-60',
        )}
      >
        {hasAssignee ? (
          <>
            <EmployeePersonAvatar
              label={assigneeLabel}
              imageUrl={assigneeAvatar}
              className={ASSIGNEE_AVATAR_TRIGGER_CLASS}
            />
            <span className="truncate font-medium">{assigneeLabel}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select assignee…</span>
        )}
      </button>

      {open ? (
        <div className="border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border shadow-lg">
          <div className="relative border-b border-stone-100 p-2 dark:border-stone-800">
            <Search
              size={14}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              ref={inputRef}
              value={query}
              disabled={disabled}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                runSearch(event.target.value);
              }}
              placeholder="Search people…"
              className="bg-muted/40 h-9 border-0 pr-3 pl-9 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
                <Loader2 size={13} className="animate-spin" aria-hidden />
                Searching…
              </div>
            ) : null}
            {!loading && results.length === 0 ? (
              <p className="text-muted-foreground px-3 py-2.5 text-xs">No people found</p>
            ) : null}
            {!loading
              ? results.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSelect(option.value, option.label, option.avatar);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'hover:bg-muted/60 flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      option.value === assigneeId && 'bg-muted/50',
                    )}
                  >
                    <EmployeePersonAvatar
                      label={option.label}
                      imageUrl={option.avatar}
                      className={ASSIGNEE_AVATAR_OPTION_CLASS}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate font-medium">
                        {option.label}
                      </span>
                      {option.subtitle ? (
                        <span className="text-muted-foreground block truncate text-xs">
                          {option.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
