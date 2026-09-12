'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { BOTTOM_SHEET_SWIPE_PANEL_CLASS } from '@/components/layout/bottom-sheet-swipe';
import { BOTTOM_SHEET_SWIPE_SCROLL_ATTR } from '@/components/layout/bottom-sheet-swipe-motion';
import {
  DIALOG_MOBILE_CLOSE_BUTTON_CLASS,
  DIALOG_MOBILE_FOOTER_CLASS,
  DIALOG_MOBILE_SHEET_BODY_CLASS,
  DIALOG_MOBILE_SHEET_POPUP_CLASS,
} from './dialog-mobile-sheet';
import { DialogMobileSwipeChrome } from './dialog-mobile-swipe-chrome';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/** Dialog above entity sheet (z-50) and nested sheets (z-70). Dropdowns use z-90. */
const DIALOG_ABOVE_SHEET_Z_CLASS = 'z-[80]';

const DIALOG_POPUP_SURFACE_CLASS =
  'bg-background ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-2xl p-5 text-sm shadow-lg ring-1 shadow-black/[0.07] duration-150 outline-none sm:max-w-sm sm:p-6';

function DialogOverlay({
  className,
  nested = false,
  ...props
}: DialogPrimitive.Backdrop.Props & { nested?: boolean }) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate bg-black/25 duration-150 supports-backdrop-filter:backdrop-blur-sm',
        nested ? DIALOG_ABOVE_SHEET_Z_CLASS : 'z-50',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  forceNestedBackdrop = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  /**
   * When opened inside another dialog/sheet, Base UI may omit the child backdrop.
   * Set true so the dimmed overlay still renders above the parent surface.
   */
  forceNestedBackdrop?: boolean;
}) {
  const isMobileViewport = useIsMobileViewport();
  const nestedStackClass = forceNestedBackdrop ? DIALOG_ABOVE_SHEET_Z_CLASS : 'z-50';
  const scrollAttr = isMobileViewport ? { [BOTTOM_SHEET_SWIPE_SCROLL_ATTR]: '' } : undefined;

  return (
    <DialogPortal>
      <DialogOverlay nested={forceNestedBackdrop} forceRender={forceNestedBackdrop} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          DIALOG_POPUP_SURFACE_CLASS,
          DIALOG_MOBILE_SHEET_POPUP_CLASS,
          isMobileViewport && BOTTOM_SHEET_SWIPE_PANEL_CLASS,
          nestedStackClass,
          className,
        )}
        {...props}
      >
        {isMobileViewport ? <DialogMobileSwipeChrome /> : null}
        <div className={DIALOG_MOBILE_SHEET_BODY_CLASS} {...scrollAttr}>
          {children}
        </div>
        {showCloseButton ? <DialogAbsoluteCloseButton /> : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogAbsoluteCloseButton() {
  const t = useTranslations('common');
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={
        <Button variant="ghost" className={DIALOG_MOBILE_CLOSE_BUTTON_CLASS} size="icon-sm" />
      }
    >
      <XIcon />
      <span className="sr-only">{t('close')}</span>
    </DialogPrimitive.Close>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  const t = useTranslations('common');
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'bg-muted/40 border-border/60 -mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-2xl border-t p-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:gap-3 sm:p-5',
        DIALOG_MOBILE_FOOTER_CLASS,
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {t('close')}
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-foreground text-lg leading-tight font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
