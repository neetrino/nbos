'use client';

import type { ReactNode } from 'react';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  type DetailSheetTabItem,
} from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import {
  NORMS_SHEET_BODY_CLASS,
  NORMS_SHEET_FOOTER_CLASS,
  NORMS_SHEET_HEADER_CLASS,
} from './delivery-norms.constants';

export function DeliveryNormsCreateSheet({
  open,
  onOpenChange,
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  dirty,
  saving,
  saveLabel,
  errorMessage,
  onSave,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tabs?: readonly DetailSheetTabItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  dirty: boolean;
  saving: boolean;
  saveLabel: string;
  errorMessage?: string | null;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="auxiliary" showRailActions={false}>
        <div className="flex h-full min-h-0 flex-col">
          <div className={NORMS_SHEET_HEADER_CLASS}>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{title}</h2>
              {description ? (
                <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
              ) : null}
            </div>
            {tabs && activeTab && onTabChange ? (
              <DetailSheetTabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="px-0"
              />
            ) : null}
          </div>
          <div className={NORMS_SHEET_BODY_CLASS}>{children}</div>
          <DetailSheetFormFooter
            visible
            dirty={dirty}
            saving={saving}
            errorMessage={errorMessage}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            saveLabel={saveLabel}
            className={NORMS_SHEET_FOOTER_CLASS}
          />
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
