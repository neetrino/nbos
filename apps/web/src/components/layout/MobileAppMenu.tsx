'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, UserCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { PwaInstallTile } from '@/components/pwa/PwaInstallTile';
import { useMyAccountSheet } from '@/features/account/components/my-account-sheet-provider';
import { cn } from '@/lib/utils';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import { BottomSheetSwipeHandle } from './BottomSheetSwipeHandle';
import { MobileAppMenuTile } from './MobileAppMenuTile';
import {
  MOBILE_APP_MENU_GRID_CLASS,
  MOBILE_APP_MENU_SHEET_CLASS,
  MOBILE_APP_MENU_TILE_CLASS,
} from './mobile-app-menu-constants';
import { BOTTOM_SHEET_SWIPE_PANEL_CLASS } from './bottom-sheet-swipe';
import { useBottomSheetSwipeToClose } from './use-bottom-sheet-swipe-to-close';
import { useTranslations } from 'next-intl';

const MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX = 20;

interface MobileAppMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavModuleDefinition[];
}

export function MobileAppMenu({ open, onOpenChange, items }: MobileAppMenuProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleRef = useBottomSheetSwipeToClose(open, close);
  const t = useTranslations('navigation');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(MOBILE_APP_MENU_SHEET_CLASS, BOTTOM_SHEET_SWIPE_PANEL_CLASS)}
      >
        <SheetTitle className="sr-only">{t('mobileMenu.title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('mobileMenu.description')}</SheetDescription>
        <div className="flex min-h-0 flex-1 flex-col">
          <BottomSheetSwipeHandle handleRef={handleRef} />
          <div className="touch-none px-4 pt-3 pb-2">
            <p className="text-foreground text-lg font-semibold tracking-tight">{t('mobileMenu.title')}</p>
          </div>
          <div
            data-nbos-sheet-swipe-scroll=""
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-5"
          >
            <div className={MOBILE_APP_MENU_GRID_CLASS}>
              {items.map((item) => (
                <MobileAppMenuTile key={item.key} item={item} onNavigate={close} />
              ))}
            </div>
            <MobileAppMenuAccountRow onClose={close} />
            <PwaInstallTile onClose={close} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileAppMenuAccountRow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { openMyAccountSheet } = useMyAccountSheet();
  const tNav = useTranslations('navigation');
  const tAccount = useTranslations('account');

  return (
    <div className={cn(MOBILE_APP_MENU_GRID_CLASS, 'mt-3')}>
      <button
        type="button"
        onClick={() => {
          onClose();
          router.push('/settings');
        }}
        className={MOBILE_APP_MENU_TILE_CLASS}
      >
        <Settings
          size={MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX}
          className="text-zinc-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">{tNav('sidebar.settings')}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          void openMyAccountSheet();
        }}
        className={MOBILE_APP_MENU_TILE_CLASS}
      >
        <UserCircle2
          size={MOBILE_APP_MENU_FOOTER_ICON_SIZE_PX}
          className="text-indigo-600"
          aria-hidden
        />
        <span className="text-sm font-semibold tracking-tight">{tAccount('myAccount')}</span>
      </button>
    </div>
  );
}
