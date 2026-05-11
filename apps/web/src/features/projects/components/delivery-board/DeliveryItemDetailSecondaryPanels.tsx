import Link from 'next/link';
import type { DeliveryDetailSecondaryId } from './delivery-item-detail.constants';
import { DeliveryItemDetailBonusPanel } from './DeliveryItemDetailBonusPanel';
import { DeliveryItemDetailCallsPanel } from './DeliveryItemDetailCallsPanel';
import { DeliveryItemDetailHistoryPanel } from './DeliveryItemDetailHistoryPanel';

interface DeliveryItemDetailSecondaryPanelsProps {
  view: DeliveryDetailSecondaryId;
  projectId: string;
  productId: string;
  auditEntityType: 'PRODUCT' | 'EXTENSION';
  auditEntityId: string;
  financeTabHref: string;
  projectHubHref: string;
  bonusOrderId: string | null;
  openDealHref: string | null;
  dealCode: string | null;
}

export function DeliveryItemDetailSecondaryPanels({
  view,
  projectId,
  productId,
  auditEntityType,
  auditEntityId,
  financeTabHref,
  projectHubHref,
  bonusOrderId,
  openDealHref,
  dealCode,
}: DeliveryItemDetailSecondaryPanelsProps) {
  const base = `/projects/${projectId}/products/${productId}`;

  return (
    <div className="space-y-5 px-5 py-5 sm:px-7">
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

      <p className="text-muted-foreground text-center text-xs">
        <Link href={`${base}?tab=tasks`} className="text-primary font-medium hover:underline">
          Open full Work Space on the product →
        </Link>
      </p>
    </div>
  );
}

function SecondaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-card/50 rounded-xl border p-5">
      <h4 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}
