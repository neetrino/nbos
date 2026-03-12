'use client';

import { useState } from 'react';
import { Trash2, LayoutGrid, History, FileText, Phone } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared';
import { DealPipelineStages } from './DealPipelineStages';
import { DealGeneralTab } from './DealGeneralTab';
import { DealHistoryTab } from './DealHistoryTab';
import { DealInvoiceTab } from './DealInvoiceTab';
import { DealCallsTab } from './DealCallsTab';
import { getDealStage, formatAmount } from '../constants/dealPipeline';
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

  const stage = getDealStage(deal.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1400px]"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-stone-100 bg-gradient-to-br from-amber-50/50 via-white to-white px-7 pt-6 pr-14 pb-4 dark:border-stone-800 dark:from-amber-950/10 dark:via-transparent dark:to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {deal.contact?.firstName} {deal.contact?.lastName}
                </h2>
                {stage && (
                  <StatusBadge
                    label={stage.label}
                    variant={stage.variant}
                    dot
                    dotColor={stage.color}
                  />
                )}
              </div>
              <p className="text-muted-foreground mt-1 font-mono text-xs tracking-wider">
                {deal.code}
              </p>
            </div>
            {deal.amount != null && (
              <div className="shrink-0 text-right">
                <p className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                  {formatAmount(deal.amount)}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[10px] font-medium tracking-widest uppercase">
                  Deal value
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pipeline Stages (always visible, includes Won/Failed) ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <DealPipelineStages
            currentStatus={deal.status}
            onStageClick={(key) => onStatusChange(deal.id, key)}
          />
        </div>

        {/* ── Tabs ── */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-stone-100 px-7 dark:border-stone-800">
            <TabsList variant="line" className="h-10 gap-1">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                  <tab.icon size={13} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5">
              <TabsContent value="general">
                <DealGeneralTab deal={deal} onUpdate={onUpdate} />
              </TabsContent>
              <TabsContent value="history">
                <DealHistoryTab />
              </TabsContent>
              <TabsContent value="invoice">
                <DealInvoiceTab deal={deal} />
              </TabsContent>
              <TabsContent value="calls">
                <DealCallsTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

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
