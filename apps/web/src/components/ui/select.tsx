'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';

import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1 space-y-0.5 p-1.5', className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('flex flex-1 text-left', className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap outline-none select-none',
        'border-border/60 bg-muted/20 text-foreground rounded-xl border text-sm font-medium shadow-sm shadow-black/[0.04]',
        'transition-[box-shadow,background-color,border-color]',
        'hover:border-border hover:bg-muted/30 dark:border-border/50 dark:bg-input/35 dark:hover:bg-input/45',
        'focus-visible:ring-ring/45 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
        'data-placeholder:text-muted-foreground',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        'data-[size=default]:h-10 data-[size=default]:min-h-10 data-[size=default]:px-3 data-[size=default]:py-2 data-[size=default]:pr-2.5',
        'data-[size=sm]:h-8 data-[size=sm]:min-h-8 data-[size=sm]:rounded-lg data-[size=sm]:px-2.5 data-[size=sm]:pr-2 data-[size=sm]:text-xs',
        '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 opacity-80" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 8,
  align = 'start',
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={cn('isolate', PORTAL_DROPDOWN_Z_CLASS)}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            'bg-popover/95 text-popover-foreground supports-[backdrop-filter]:bg-popover/85',
            'ring-border/40 shadow-xl ring-1 shadow-black/[0.08]',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            PORTAL_DROPDOWN_Z_CLASS,
            'relative isolate max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl p-1.5 backdrop-blur-md duration-150',
            'data-[align-trigger=true]:animate-none',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="flex flex-col gap-0.5 outline-none">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        'text-muted-foreground px-3 py-2 text-[0.6875rem] font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-pointer items-center gap-2 rounded-lg py-2 pr-9 pl-3 text-sm font-medium transition-colors outline-none select-none',
        'text-foreground/90 hover:bg-muted/70 focus:bg-accent focus:text-accent-foreground',
        'not-data-[variant=destructive]:focus:**:text-accent-foreground',
        'data-disabled:pointer-events-none data-disabled:opacity-45',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        '*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="text-primary pointer-events-none absolute right-2.5 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="size-4 shrink-0 stroke-[2.5]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border/80 pointer-events-none -mx-0.5 my-1.5 h-px', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        'text-muted-foreground hover:text-foreground from-popover top-0 z-10 flex w-full cursor-pointer items-center justify-center bg-gradient-to-b to-transparent py-1.5 transition-colors [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        'text-muted-foreground hover:text-foreground from-popover bottom-0 z-10 flex w-full cursor-pointer items-center justify-center bg-gradient-to-t to-transparent py-1.5 transition-colors [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
