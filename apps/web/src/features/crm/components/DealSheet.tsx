'use client';

import { useState } from 'react';
import {
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  LayoutGrid,
  History,
  FileText,
  Phone,
} from 'lucide-react';
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
import { ACTIVE_DEAL_STAGES, getDealStage, formatAmount } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { cn } from '@/lib/utils';

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
  const isTerminal = deal.status === 'FAILED' || deal.status === 'WON';
  const currentIdx = ACTIVE_DEAL_STAGES.findIndex((s) => s.key === deal.status);
  const nextStage = currentIdx >= 0 ? ACTIVE_DEAL_STAGES[currentIdx + 1] : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[72vw] sm:max-w-[920px]"
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

        {/* ── Pipeline Stages ── */}
        {!isTerminal && (
          <div className="shrink-0 border-b border-stone-100 px-7 py-2.5 dark:border-stone-800">
            <DealPipelineStages
              currentStatus={deal.status}
              onStageClick={(key) => onStatusChange(deal.id, key)}
            />
          </div>
        )}

        {/* ── Terminal State ── */}
        {isTerminal && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-3 border-b px-7 py-3',
              deal.status === 'WON'
                ? 'border-emerald-100 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-red-100 bg-red-50/80 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
            )}
          >
            {deal.status === 'WON' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <div>
              <p className="text-sm font-semibold">
                {deal.status === 'WON' ? 'Deal Won' : 'Deal Failed'}
              </p>
              <p className="text-xs opacity-75">
                {deal.status === 'WON' ? 'Successfully closed' : 'Did not go through'}
              </p>
            </div>
          </div>
        )}

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

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-stone-100 bg-stone-50/50 px-7 py-3 dark:border-stone-800 dark:bg-stone-900/20">
          <div className="flex items-center justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                  onClick={() => onDelete(deal.id)}
                >
                  <Trash2 size={13} className="mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {!isTerminal && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    onClick={() => onStatusChange(deal.id, 'FAILED')}
                  >
                    <XCircle size={13} className="mr-1" />
                    Failed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                    onClick={() => onStatusChange(deal.id, 'WON')}
                  >
                    <CheckCircle2 size={13} className="mr-1" />
                    Won
                  </Button>
                  {nextStage && (
                    <Button
                      size="sm"
                      className="bg-amber-500 text-xs text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600"
                      onClick={() => onStatusChange(deal.id, nextStage.key)}
                    >
                      {nextStage.shortLabel}
                      <ArrowRight size={13} className="ml-1" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
