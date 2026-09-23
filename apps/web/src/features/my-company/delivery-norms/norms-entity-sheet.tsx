'use client';

import type { ReactNode } from 'react';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  type DetailSheetTabItem,
} from '@/components/shared';
import {
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { cn } from '@/lib/utils';

const DESKTOP_HEADER_CLASS = 'shrink-0 px-7 pt-5 pb-3';

export function NormsEntitySheet({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  badge,
  tabs,
  activeTab,
  onTabChange,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  tabs: readonly DetailSheetTabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  footer?: {
    visible: boolean;
    dirty: boolean;
    saving: boolean;
    errorMessage?: string | null;
    onSave: () => void;
    onCancel: () => void;
    saveLabel?: string;
  };
  children: ReactNode;
}) {
  const { persistedValue, onOpenChangeComplete } = useSheetPersistedValue(open ? title : null);
  const hostMounted = useSheetHostMounted(open, persistedValue);
  if (!hostMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent open={open} layout="full" width="compact" showRailActions={false}>
        <NormsEntitySheetHeader title={title} subtitle={subtitle} icon={icon} badge={badge} />
        <DetailSheetTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className="max-md:mt-3 max-md:px-4"
        />
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5 max-md:px-4">{children}</div>
        </ScrollArea>
        {footer ? (
          <DetailSheetFormFooter
            visible={footer.visible}
            dirty={footer.dirty}
            saving={footer.saving}
            errorMessage={footer.errorMessage}
            onSave={footer.onSave}
            onCancel={footer.onCancel}
            saveLabel={footer.saveLabel}
          />
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function NormsEntitySheetHeader({
  title,
  subtitle,
  icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
}) {
  const isMobileViewport = useIsMobileViewport();
  return (
    <div
      className={isMobileViewport ? DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS : DESKTOP_HEADER_CLASS}
    >
      <div
        className={cn(
          'inline-flex max-w-full min-w-0 flex-wrap items-center gap-2',
          isMobileViewport && DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
        )}
      >
        <span className="text-foreground shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-foreground truncate text-xl font-bold tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{subtitle}</p>
          ) : null}
        </div>
        {badge}
      </div>
    </div>
  );
}
