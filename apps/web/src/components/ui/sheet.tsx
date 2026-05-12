'use client';

import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

/** Above sheet overlay/popup (z-50) so the rail stays clickable. */
const SHEET_FLOATING_RAIL_Z_INDEX = 60;

/** Nested child sheet stacks above parent floating rail ({@link SHEET_FLOATING_RAIL_Z_INDEX}). */
const SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS = 'z-[70]';

/** Nested sheet popup uses z-70; rail sits above the panel seam so tabs stay clickable. */
const SHEET_NESTED_FLOATING_RAIL_Z_INDEX = 71;

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  stackAboveFloatingRail = false,
  ...props
}: SheetPrimitive.Backdrop.Props & { stackAboveFloatingRail?: boolean }) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs',
        stackAboveFloatingRail ? SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS : 'z-50',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  floatingClose = false,
  floatingRail,
  floatingRailVisible = true,
  floatingRailAnchorClassName,
  forceNestedBackdrop = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  /** Right sheet: close control sits outside the panel (CRM-style). */
  floatingClose?: boolean;
  /** Extra controls below the floating close (e.g. copy link). */
  floatingRail?: React.ReactNode;
  /** Visibility state for floating rail animations; pass sheet `open` for sync. */
  floatingRailVisible?: boolean;
  /** Tailwind horizontal anchor for the rail (must match panel width on `sm+`). */
  floatingRailAnchorClassName?: string;
  /**
   * When this sheet opens inside another dialog/sheet, Base UI omits the child backdrop by default.
   * Set true so the dimmed overlay still receives clicks and dismisses this sheet (e.g. stage checklist in product card).
   */
  forceNestedBackdrop?: boolean;
}) {
  const floatingRailEnabled = floatingClose && side === 'right';
  const nestedStackClass = forceNestedBackdrop ? SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS : 'z-50';

  return (
    <SheetPortal>
      <SheetOverlay
        forceRender={forceNestedBackdrop}
        stackAboveFloatingRail={forceNestedBackdrop}
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'bg-background fixed flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem]',
          nestedStackClass,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className="absolute top-5 right-6" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
      {floatingRailEnabled ? (
        <div
          className={cn(
            'fixed flex flex-col items-end gap-1.5 transition-all duration-200 ease-in-out max-sm:top-14 max-sm:left-3 sm:top-10 sm:translate-x-px',
            floatingRailVisible
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-[2.5rem] opacity-0',
            floatingRailAnchorClassName ?? 'sm:right-[90vw]',
          )}
          style={{
            zIndex: forceNestedBackdrop
              ? SHEET_NESTED_FLOATING_RAIL_Z_INDEX
              : SHEET_FLOATING_RAIL_Z_INDEX,
          }}
        >
          <SheetPrimitive.Close
            data-slot="sheet-close-floating"
            render={
              <Button
                type="button"
                variant="default"
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90 size-11 shrink-0 rounded-full border-0 shadow-md sm:rounded-l-full sm:rounded-r-none"
                aria-label="Close panel"
              />
            }
          >
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
          {floatingRail}
        </div>
      ) : null}
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-0.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground text-base font-medium', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
