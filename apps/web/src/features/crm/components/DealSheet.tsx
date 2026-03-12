'use client';

import { useState } from 'react';
import { Trash2, LayoutGrid, History, FileText, Phone } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DealPipelineStages } from './DealPipelineStages';
import { DealGeneralTab } from './DealGeneralTab';
import { DealHistoryTab } from './DealHistoryTab';
import { DealInvoiceTab } from './DealInvoiceTab';
import { DealCallsTab } from './DealCallsTab';
import type { Deal } from '@/lib/api/deals';

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
  { value: 'invoice', label: 'Invoice', icon: FileText },
  { value: 'calls', label: 'Calls', icon: Phone },
] as const;

interface DealSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function DealSheet({
  deal,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onDelete,
}: DealSheetProps) {
  const [activeTab, setActiveTab] = useState('general');

  if (!deal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1400px]"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-stone-100 bg-gradient-to-br from-amber-50/50 via-white to-white px-7 pt-5 pb-3 dark:border-stone-800 dark:from-amber-950/10 dark:via-transparent dark:to-transparent">
          <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
            {deal.contact?.firstName} {deal.contact?.lastName}
          </h2>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
            {deal.code}
          </p>
        </div>

        {/* ── Pipeline Stages (always visible, includes Won/Failed) ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <DealPipelineStages
            currentStatus={deal.status}
            onStageClick={(key) => onStatusChange(deal.id, key)}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 dark:border-stone-800">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={
                    'relative flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ' +
                    (isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                      : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300')
                  }
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5">
            {activeTab === 'general' && <DealGeneralTab deal={deal} onUpdate={onUpdate} />}
            {activeTab === 'history' && <DealHistoryTab />}
            {activeTab === 'invoice' && <DealInvoiceTab deal={deal} />}
            {activeTab === 'calls' && <DealCallsTab />}
          </div>
        </ScrollArea>

        {/* ── Footer (only Delete) ── */}
        {onDelete && (
          <div className="shrink-0 border-t border-stone-100 bg-stone-50/50 px-7 py-3 dark:border-stone-800 dark:bg-stone-900/20">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
              onClick={() => onDelete(deal.id)}
            >
              <Trash2 size={13} className="mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
