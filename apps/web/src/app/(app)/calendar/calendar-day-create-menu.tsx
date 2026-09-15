'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CALENDAR_CREATE_OPTIONS, CalendarCreateKindIcon } from './calendar-create-options';
import { CALENDAR_CREATE_MENU_WIDTH_CLASS, type CalendarCreateKind } from './calendar-ui-constants';

const CELL_PLUS_HIDDEN_CLASS =
  'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 aria-expanded:pointer-events-auto aria-expanded:opacity-100';

function cellPlusButtonClass(persistVisible: boolean, extra?: string): string {
  return cn(
    'border-border/80 bg-background/95 absolute top-1.5 right-1.5 z-10 rounded-full shadow-sm backdrop-blur-sm max-sm:top-auto max-sm:bottom-1.5',
    persistVisible ? 'opacity-100' : CELL_PLUS_HIDDEN_CLASS,
    extra,
  );
}

const PANEL_PLUS_BUTTON_CLASS =
  'border-border bg-card hover:bg-secondary size-14 rounded-full shadow-md ring-1 ring-border/60';

export function CalendarDayCreateMenu({
  date,
  persistVisible = false,
  variant = 'cell',
  onSelectDate,
  onCreate,
}: {
  date: Date;
  persistVisible?: boolean;
  variant?: 'cell' | 'panel';
  onSelectDate: (date: Date) => void;
  onCreate: (date: Date, kind: CalendarCreateKind) => void;
}) {
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isPanel = variant === 'panel';

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) onSelectDate(date);
      }}
    >
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size={isPanel ? 'icon' : 'icon-xs'}
            className={cn(
              isPanel ? PANEL_PLUS_BUTTON_CLASS : cellPlusButtonClass(persistVisible),
              props.className,
            )}
            aria-label={isPanel ? `Add on ${formatted}` : `Create on ${formatted}`}
          >
            <Plus
              className={isPanel ? 'size-7' : undefined}
              strokeWidth={isPanel ? 2.25 : undefined}
              aria-hidden
            />
          </Button>
        )}
      />
      <DropdownMenuContent
        align={isPanel ? 'center' : 'end'}
        side={isPanel ? 'top' : 'bottom'}
        sideOffset={6}
        className={cn(CALENDAR_CREATE_MENU_WIDTH_CLASS, 'rounded-xl p-1.5')}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">New on {formatted}</DropdownMenuLabel>
          {CALENDAR_CREATE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.kind}
              onClick={() => onCreate(date, option.kind)}
              className="gap-2.5 rounded-lg py-2"
            >
              <CalendarCreateKindIcon kind={option.kind} size="md" />
              <span className="text-foreground font-medium">{option.menuTitle}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
