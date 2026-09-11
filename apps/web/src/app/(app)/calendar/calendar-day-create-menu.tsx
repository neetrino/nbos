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

const PLUS_HIDDEN_CLASS =
  'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 aria-expanded:pointer-events-auto aria-expanded:opacity-100';

function plusButtonClass(persistVisible: boolean, extra?: string): string {
  return cn(
    'border-border/80 bg-background/95 absolute top-1.5 right-1.5 z-10 rounded-full shadow-sm backdrop-blur-sm max-sm:top-auto max-sm:bottom-1.5',
    persistVisible ? 'opacity-100' : PLUS_HIDDEN_CLASS,
    extra,
  );
}

export function CalendarDayCreateMenu({
  date,
  persistVisible,
  onSelectDate,
  onCreate,
}: {
  date: Date;
  persistVisible: boolean;
  onSelectDate: (date: Date) => void;
  onCreate: (date: Date, kind: CalendarCreateKind) => void;
}) {
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
            size="icon-xs"
            className={plusButtonClass(persistVisible, props.className)}
            aria-label={`Create on ${formatted}`}
          >
            <Plus aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent
        align="end"
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
