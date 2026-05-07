'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const TabsListVariantContext = React.createContext<'default' | 'line' | 'pill'>('default');

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

export const tabsListVariants = cva('', {
  variants: {
    variant: {
      default:
        'inline-flex h-10 items-center justify-center rounded-lg bg-muted p-0.5 text-muted-foreground/70',
      line: 'inline-flex h-auto w-full min-w-0 items-center justify-start gap-0 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground/70',
      pill: 'inline-flex h-auto w-full min-w-0 items-center justify-stretch gap-1 rounded-full bg-muted p-1 text-muted-foreground sm:inline-flex sm:w-auto sm:justify-start',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsListVariantContext.Provider value={variant ?? 'default'}>
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
  'inline-flex items-center justify-center whitespace-nowrap font-medium outline-offset-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      listVariant: {
        default:
          'rounded-md px-3 py-1.5 text-sm hover:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/5',
        line: 'relative gap-2 rounded-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent after:transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-primary sm:px-4',
        pill: 'flex-1 gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:flex-initial [&_svg]:text-muted-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/[0.06] data-[state=active]:[&_svg]:text-foreground',
      },
    },
    defaultVariants: {
      listVariant: 'default',
    },
  },
);

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
      'focus-visible:outline-ring/70 mt-2 outline-offset-2 focus-visible:outline focus-visible:outline-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
