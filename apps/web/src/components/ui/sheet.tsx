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
import {
  ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS,
  ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS,
  ENTITY_SHEET_FLOATING_RAIL_STACK_CLASS,
} from '@/components/shared/entity-sheet-floating-rail';
import { SheetCenterShell } from '@/components/ui/sheet-center-shell';

/** Above sheet overlay/popup (z-50) so the viewport rail stays clickable. */
const SHEET_FLOATING_RAIL_Z_INDEX = 60;

/** Nested child sheet stacks above parent floating rail ({@link SHEET_FLOATING_RAIL_Z_INDEX}). */
const SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS = 'z-[70]';

/** Nested sheet popup uses z-70; viewport rail sits above the panel seam when nested. */
const SHEET_NESTED_FLOATING_RAIL_Z_INDEX = 71;

const SHEET_POPUP_BASE_CLASS =
  'bg-background flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0';

const SHEET_SIDE_EDGE_CLASS =
  'data-[side=bottom]:fixed data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:fixed data-[side=left]:top-[2.5vh] data-[side=left]:bottom-[2.5vh] data-[side=left]:left-0 data-[side=left]:h-auto data-[side=left]:max-h-[95vh] data-[side=left]:w-3/4 data-[side=left]:rounded-r-2xl data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:fixed data-[side=right]:top-[2.5vh] data-[side=right]:right-0 data-[side=right]:bottom-0 data-[side=right]:h-auto data-[side=right]:max-h-[calc(100vh-2.5vh)] data-[side=right]:w-3/4 data-[side=right]:rounded-tl-2xl data-[side=right]:border-l data-[side=right]:border-b-0 data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:fixed data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem]';

const SHEET_FLOATING_RAIL_INSET_CLASS =
  'pointer-events-none absolute z-10 overflow-visible max-sm:top-3 max-sm:-left-12 sm:-left-11';

const SHEET_FLOATING_RAIL_DEFAULT_TOP_CLASS = 'sm:top-[1.5rem]';

function SheetFloatingRailInset({
  floatingRail,
  showClose,
  topClassName,
}: {
  floatingRail?: React.ReactNode;
  showClose: boolean;
  topClassName?: string;
}) {
  return (
    <div
      className={cn(
        SHEET_FLOATING_RAIL_INSET_CLASS,
        SHEET_FLOATING_RAIL_DEFAULT_TOP_CLASS,
        topClassName,
      )}
    >
      <SheetFloatingRailStack
        floatingRail={floatingRail}
        floatingRailVisible
        showClose={showClose}
        className="pointer-events-auto"
      />
    </div>
  );
}

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
        ENTITY_SHEET_FLOATING_RAIL_STACK_CLASS,
        'transition-all duration-200 ease-in-out',
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
              className={ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS}
              aria-label="Close panel"
              title="Close"
            />
          }
        >
          <XIcon className="size-4" aria-hidden />
          <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>Close</span>
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
        'fixed inset-0 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0',
        stackAboveFloatingRail
          ? cn(
              SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS,
              'bg-black/25 supports-backdrop-filter:backdrop-blur-sm',
            )
          : 'z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs',
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
  floatingRailTopClassName,
  floatingRailPlacement = 'viewport',
  forceNestedBackdrop = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  showCloseButton?: boolean;
  floatingClose?: boolean;
  floatingRail?: React.ReactNode;
  floatingRailVisible?: boolean;
  floatingRailAnchorClassName?: string;
  floatingRailTopClassName?: string;
  /** `viewport` = fixed rail at panel seam (entity sheets). `inset` = inside panel (page settings). */
  floatingRailPlacement?: 'viewport' | 'inset';
  forceNestedBackdrop?: boolean;
}) {
  const floatingRailEnabled = floatingClose && (side === 'right' || side === 'center');
  const centerFloatingRail = floatingClose && side === 'center';
  const rightFloatingRail = floatingClose && side === 'right';
  const insetFloatingRail = rightFloatingRail && floatingRailPlacement === 'inset';
  const viewportFloatingRail = rightFloatingRail && floatingRailPlacement === 'viewport';
  const nestedStackClass = forceNestedBackdrop ? SHEET_NESTED_ABOVE_PARENT_RAIL_Z_CLASS : 'z-50';

  const popupClassName = cn(
    SHEET_POPUP_BASE_CLASS,
    side !== 'center' && SHEET_SIDE_EDGE_CLASS,
    side === 'center' && SHEET_CENTER_PANEL_SURFACE_CLASS,
    side !== 'center' && nestedStackClass,
    insetFloatingRail && 'relative overflow-visible',
    'pointer-events-auto bg-background',
    className,
  );

  const popupBody = (
    <>
      {insetFloatingRail ? (
        <SheetFloatingRailInset
          floatingRail={floatingRail}
          showClose={floatingClose}
          topClassName={floatingRailTopClassName}
        />
      ) : null}
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
      {viewportFloatingRail ? (
        <div
          className={cn(
            'fixed overflow-visible transition-all duration-200 ease-in-out max-sm:top-[calc(3.5rem+0.25rem)] max-sm:left-3 sm:translate-x-px',
            SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
            floatingRailTopClassName,
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
