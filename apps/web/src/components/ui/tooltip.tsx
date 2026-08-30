'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';

const TOOLTIP_CONTENT_CLASS = cn(
  'bg-foreground text-background inline-flex w-fit max-w-xs origin-(--transform-origin)',
  'items-center rounded-md px-2.5 py-1 text-xs font-medium tabular-nums shadow-md',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
  'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
);

const TOOLTIP_ARROW_CLASS = cn(
  'bg-foreground fill-foreground z-50 size-2.5 rotate-45 rounded-[2px]',
  'translate-y-[calc(-50%-2px)]',
  'data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5',
  'data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2',
  'data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2',
);

function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 6,
  align = 'center',
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={cn('isolate', PORTAL_DROPDOWN_Z_CLASS)}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(TOOLTIP_CONTENT_CLASS, PORTAL_DROPDOWN_Z_CLASS, className)}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className={TOOLTIP_ARROW_CLASS} />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
