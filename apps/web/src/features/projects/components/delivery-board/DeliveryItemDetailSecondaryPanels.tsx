import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { DeliveryDetailSecondaryId } from './delivery-item-detail.constants';
import { DeliveryItemDetailBonusPanel } from './DeliveryItemDetailBonusPanel';
import { DeliveryItemDetailCallsPanel } from './DeliveryItemDetailCallsPanel';
import { DeliveryItemDetailHistoryPanel } from './DeliveryItemDetailHistoryPanel';
import { DeliveryItemDetailWorkSpacePanel } from './DeliveryItemDetailWorkSpacePanel';

interface DeliveryItemDetailSecondaryPanelsProps {
  view: DeliveryDetailSecondaryId;
  auditEntityType: 'PRODUCT' | 'EXTENSION';
  auditEntityId: string;
  financeTabHref: string;
  projectHubHref: string;
  workSpaceHref: string;
  productId: string;
  onTaskCreateOpenChange: (open: boolean) => void;
  tasksRefreshSignal?: number;
  bonusOrderId: string | null;
  openDealHref: string | null;
  dealCode: string | null;
}

export function DeliveryItemDetailSecondaryPanels({
  view,
  auditEntityType,
  auditEntityId,
  financeTabHref,
  projectHubHref,
  workSpaceHref,
  productId,
  onTaskCreateOpenChange,
  tasksRefreshSignal,
  bonusOrderId,
  openDealHref,
  dealCode,
}: DeliveryItemDetailSecondaryPanelsProps) {
  return (
    <div className="space-y-5 px-5 py-5 sm:px-7">
      {view === 'workspace' ? (
        <DeliveryItemDetailWorkSpacePanel
          productId={productId}
          workSpaceHref={workSpaceHref}
          onCreateOpenChange={onTaskCreateOpenChange}
          tasksRefreshSignal={tasksRefreshSignal}
        />
      ) : null}

      {view === 'calls' ? (
        <SecondaryCard title="Calls">
          <DeliveryItemDetailCallsPanel
            projectHubHref={projectHubHref}
            openDealHref={openDealHref}
            dealCode={dealCode}
          />
        </SecondaryCard>
      ) : null}

      {view === 'bonus' ? (
        <SecondaryCard title="Bonus">
          <DeliveryItemDetailBonusPanel orderId={bonusOrderId} financeTabHref={financeTabHref} />
        </SecondaryCard>
      ) : null}

      {view === 'history' ? (
        <SecondaryCard title="History">
          <DeliveryItemDetailHistoryPanel entityType={auditEntityType} entityId={auditEntityId} />
        </SecondaryCard>
      ) : null}
    </div>
  );
}

function SecondaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-card/50 rounded-xl border p-5">
      <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3')}>{title}</h4>
      {children}
    </section>
  );
}
