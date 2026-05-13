import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DeliveryDetailSecondaryId } from './delivery-item-detail.constants';
import { DeliveryItemDetailBonusPanel } from './DeliveryItemDetailBonusPanel';
import { DeliveryItemDetailCallsPanel } from './DeliveryItemDetailCallsPanel';
import { DeliveryItemDetailHistoryPanel } from './DeliveryItemDetailHistoryPanel';

interface DeliveryItemDetailSecondaryPanelsProps {
  view: DeliveryDetailSecondaryId;
  auditEntityType: 'PRODUCT' | 'EXTENSION';
  auditEntityId: string;
  financeTabHref: string;
  projectHubHref: string;
  workSpaceHref: string;
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
  bonusOrderId,
  openDealHref,
  dealCode,
}: DeliveryItemDetailSecondaryPanelsProps) {
  return (
    <div className="space-y-5 px-5 py-5 sm:px-7">
      {view === 'workspace' ? (
        <SecondaryCard title="Work Space">
          <p className="text-muted-foreground mb-4 text-sm">
            Tasks, checklists, and day-to-day execution live on the product workspace.
          </p>
          <Link
            href={workSpaceHref}
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex')}
          >
            Open Work Space
          </Link>
        </SecondaryCard>
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
      <h4 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}
