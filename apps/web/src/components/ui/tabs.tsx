'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Radix tabs for **pages** (`pill`) and **compact filters** (`segmented`).
 *
 * Entity detail sheets must use {@link DetailSheetTabBar} from `@/components/shared` —
 * not `Tabs`, or every sheet tab inherits page/filter defaults by mistake.
 */
type TabsListVariant = 'pill' | 'segmented';

const PILL_TAB_SHAPE_CLASS = 'gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors';
const PILL_TAB_INACTIVE_CLASS = 'text-muted-foreground hover:bg-secondary hover:text-foreground';
const PILL_TAB_ACTIVE_CLASS = 'bg-primary text-primary-foreground shadow-none';

const TabsListVariantContext = React.createContext<TabsListVariant>('pill');

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

export const tabsListVariants = cva('text-muted-foreground', {
  variants: {
    variant: {
      pill: 'inline-flex h-auto min-w-0 items-center gap-1 overflow-x-auto pb-0',
      segmented:
        'inline-flex h-auto min-w-0 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5',
    },
  },
  defaultVariants: {
    variant: 'pill',
  },
});

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsListVariantContext.Provider value={variant ?? 'pill'}>
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsListVariantContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium outline-offset-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      listVariant: {
        pill: cn(
          PILL_TAB_SHAPE_CLASS,
          PILL_TAB_INACTIVE_CLASS,
          'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none',
        ),
        segmented:
          'gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm',
      },
    },
    defaultVariants: {
      listVariant: 'pill',
    },
  },
);

/** Pill tab button class for plain `<button>` strips (e.g. {@link DetailSheetTabBar}). */
export function pillTabButtonClass(isActive: boolean): string {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-medium outline-offset-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70',
    PILL_TAB_SHAPE_CLASS,
    isActive ? PILL_TAB_ACTIVE_CLASS : PILL_TAB_INACTIVE_CLASS,
  );
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const listVariantContext = React.useContext(TabsListVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ listVariant: listVariantContext }), className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      'flex-1 text-sm outline-none focus-visible:outline-none',
      'data-[state=inactive]:hidden',
      'focus-visible:outline-ring/70 mt-2 outline-offset-2 focus-visible:outline focus-visible:outline-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsTriggerVariants };
export type { TabsListVariant };
