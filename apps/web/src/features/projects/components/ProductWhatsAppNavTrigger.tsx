'use client';

import type { ComponentPropsWithRef } from 'react';
import { WhatsAppBrandIcon } from '@/components/shared/WhatsAppBrandIcon';
import { SIDEBAR_NAV_ITEM_CLASS } from '@/components/layout/sidebar-layout-constants';
import { tabsTriggerVariants } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const WHATSAPP_NAV_LABEL = 'WhatsApp';
const WHATSAPP_ICON_SIZE_CLASS = 'size-4';
const WHATSAPP_ICON_TILE_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 transition-all duration-150 dark:text-emerald-400';

const INLINE_CLASS = cn(
  'group inline-flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors duration-150',
  SIDEBAR_NAV_ITEM_CLASS,
  'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
);

export function ProductWhatsAppNavTrigger({
  className,
  hideLabelOnMobile = false,
  variant = 'inline',
  ...props
}: ComponentPropsWithRef<'button'> & {
  hideLabelOnMobile?: boolean;
  variant?: 'inline' | 'tab';
}) {
  const variantClass =
    variant === 'tab' ? cn(tabsTriggerVariants({ listVariant: 'pill' }), 'gap-1.5') : INLINE_CLASS;

  return (
    <button
      type="button"
      title={WHATSAPP_NAV_LABEL}
      aria-label={WHATSAPP_NAV_LABEL}
      className={cn(variantClass, className)}
      {...props}
    >
      <span className={WHATSAPP_ICON_TILE_CLASS} aria-hidden>
        <WhatsAppBrandIcon className={WHATSAPP_ICON_SIZE_CLASS} />
      </span>
      <span className={cn(hideLabelOnMobile && 'hidden sm:inline')}>{WHATSAPP_NAV_LABEL}</span>
    </button>
  );
}
