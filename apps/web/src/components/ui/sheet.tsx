'use client';

import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import {
  SHEET_CENTER_PANEL_SURFACE_CLASS,
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { SheetCenterShell } from '@/components/ui/sheet-center-shell';

/** Above sheet overlay/popup (z-50) so the rail stays clickable. */
const SHEET_FLOATING_RAIL_Z_INDEX = 60;

/** Nested child sheet stacks above parent floating rail ({@link SHEET_FLOATING_RAIL_Z_INDEX}). */
const SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS = 'z-[70]';

/** Nested sheet popup uses z-70; rail sits above the panel seam so tabs stay clickable. */
const SHEET_NESTED_FLOATING_RAIL_Z_INDEX = 71;

const SHEET_POPUP_BASE_CLASS =
  'bg-background flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0';

const SHEET_SIDE_EDGE_CLASS =
  'data-[side=bottom]:fixed data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:fixed data-[side=left]:top-[2.5vh] data-[side=left]:bottom-[2.5vh] data-[side=left]:left-0 data-[side=left]:h-auto data-[side=left]:max-h-[95vh] data-[side=left]:w-3/4 data-[side=left]:rounded-r-2xl data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:fixed data-[side=right]:top-[2.5vh] data-[side=right]:right-0 data-[side=right]:bottom-0 data-[side=right]:h-auto data-[side=right]:max-h-[calc(100vh-2.5vh)] data-[side=right]:w-3/4 data-[side=right]:rounded-tl-2xl data-[side=right]:border-l data-[side=right]:border-b-0 data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:fixed data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem]';

const SHEET_FLOATING_RAIL_HINT_CLASS =
  'pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-all duration-150 group-hover/sheet-floating-close:translate-x-0 group-hover/sheet-floating-close:opacity-100 group-focus-visible/sheet-floating-close:translate-x-0 group-focus-visible/sheet-floating-close:opacity-100 max-sm:left-full max-sm:ml-2 max-sm:translate-x-1 sm:right-full sm:mr-2 sm:-translate-x-1';

const SHEET_FLOATING_CLOSE_BUTTON_CLASS =
  'group/sheet-floating-close bg-primary text-primary-foreground hover:bg-primary/90 relative size-11 shrink-0 overflow-visible rounded-full border-0 shadow-md sm:rounded-l-full sm:rounded-r-none';

function SheetFloatingRailStack({
  floatingRail,
  floatingRailVisible = true,
  showClose = true,
  className,
}: {
  floatingRail?: React.ReactNode;
  floatingRailVisible?: boolean;
  showClose?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-end gap-1.5 transition-all duration-200 ease-in-out',
        floatingRailVisible
          ? 'pointer-events-auto translate-x-0 opacity-100'
          : 'pointer-events-none translate-x-[2.5rem] opacity-0',
        className,
      )}
    >
      {showClose ? (
        <SheetPrimitive.Close
          data-slot="sheet-close-floating"
          render={
            <Button
              type="button"
              variant="default"
              size="icon"
              className={SHEET_FLOATING_CLOSE_BUTTON_CLASS}
              aria-label="Close panel"
              title="Close"
            />
          }
        >
          <XIcon className="size-5" />
          <span className={SHEET_FLOATING_RAIL_HINT_CLASS}>Close</span>
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      ) : null}
      {floatingRail}
    </div>
  );
}

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
  side?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  showCloseButton?: boolean;
  floatingClose?: boolean;
  floatingRail?: React.ReactNode;
  floatingRailVisible?: boolean;
  floatingRailAnchorClassName?: string;
  forceNestedBackdrop?: boolean;
}) {
  const floatingRailEnabled = floatingClose && (side === 'right' || side === 'center');
  const centerFloatingRail = floatingClose && side === 'center';
  const rightFloatingRail = floatingClose && side === 'right';
  const nestedStackClass = forceNestedBackdrop ? SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS : 'z-50';

  const popupClassName = cn(
    SHEET_POPUP_BASE_CLASS,
    side !== 'center' && SHEET_SIDE_EDGE_CLASS,
    side === 'center' && SHEET_CENTER_PANEL_SURFACE_CLASS,
    side !== 'center' && nestedStackClass,
    'pointer-events-auto bg-background',
    className,
  );

  const popupBody = (
    <>
      {children}
      {showCloseButton && !floatingRailEnabled && (
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={
            <Button
              variant="ghost"
              className="absolute top-5 right-6"
              size="icon-sm"
              title="Close"
              aria-label="Close panel"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
    </>
  );

  const popup = (
    <SheetPrimitive.Popup
      data-slot="sheet-content"
      data-side={side}
      className={popupClassName}
      {...props}
    >
      {popupBody}
    </SheetPrimitive.Popup>
  );

  return (
    <SheetPortal>
      <SheetOverlay
        forceRender={forceNestedBackdrop}
        stackAboveFloatingRail={forceNestedBackdrop}
      />
      {centerFloatingRail ? (
        <SheetCenterShell
          floatingRailVisible={floatingRailVisible}
          nestedStackClass={nestedStackClass}
          rail={
            <SheetFloatingRailStack
              floatingRail={floatingRail}
              floatingRailVisible={floatingRailVisible}
              showClose={floatingClose}
            />
          }
          panel={popup}
        />
      ) : (
        popup
      )}
      {rightFloatingRail ? (
        <div
          className={cn(
            'fixed flex flex-col items-end gap-1.5 transition-all duration-200 ease-in-out max-sm:top-[calc(3.5rem+0.25rem)] max-sm:left-3 sm:translate-x-px',
            SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
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
          <SheetFloatingRailStack
            floatingRail={floatingRail}
            floatingRailVisible={floatingRailVisible}
            showClose={floatingClose}
          />
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
