'use client';

import Link from 'next/link';
import { SidebarModuleIcon } from '@/components/layout/SidebarModuleIcon';
import { SIDEBAR_NAV_ITEM_CLASS } from '@/components/layout/sidebar-layout-constants';
import { tabsTriggerVariants } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type EntityDriveNavActionVariant = 'inline' | 'tab' | 'block';

export interface EntityDriveNavActionProps {
  /** Defaults to "Drive". */
  label?: string;
  href?: string;
  onClick?: () => void;
  variant?: EntityDriveNavActionVariant;
  className?: string;
  hideLabelOnMobile?: boolean;
}

const INLINE_CLASS = cn(
  'group inline-flex items-center gap-2 rounded-md text-[13px] font-medium transition-colors duration-150',
  SIDEBAR_NAV_ITEM_CLASS,
  'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
);

function resolveVariantClass(variant: EntityDriveNavActionVariant): string {
  if (variant === 'tab') {
    return tabsTriggerVariants({ listVariant: 'default' });
  }
  if (variant === 'block') {
    return cn(INLINE_CLASS, 'w-full justify-center');
  }
  return INLINE_CLASS;
}

function DriveNavContent({
  label,
  hideLabelOnMobile,
}: {
  label: string;
  hideLabelOnMobile?: boolean;
}) {
  return (
    <>
      <SidebarModuleIcon moduleKey="drive" />
      <span className={cn(hideLabelOnMobile && 'hidden sm:inline')}>{label}</span>
    </>
  );
}

/** Drive entry styled like a left-sidebar module row — shared across entity pages and heroes. */
export function EntityDriveNavAction({
  label = 'Drive',
  href,
  onClick,
  variant = 'inline',
  className,
  hideLabelOnMobile = false,
}: EntityDriveNavActionProps) {
  const variantClass = resolveVariantClass(variant);
  const content = <DriveNavContent label={label} hideLabelOnMobile={hideLabelOnMobile} />;

  if (href) {
    return (
      <Link href={href} title={label} className={cn(variantClass, className)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" title={label} onClick={onClick} className={cn(variantClass, className)}>
      {content}
    </button>
  );
}
