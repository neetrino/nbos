import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { DeliveryDetailSecondaryId } from './delivery-item-detail.constants';
import { DeliveryItemDetailHistoryPanel } from './DeliveryItemDetailHistoryPanel';

interface DeliveryItemDetailSecondaryPanelsProps {
  view: DeliveryDetailSecondaryId;
  projectId: string;
  productId: string;
  auditEntityType: 'PRODUCT' | 'EXTENSION';
  auditEntityId: string;
  onBack: () => void;
}

export function DeliveryItemDetailSecondaryPanels({
  view,
  projectId,
  productId,
  auditEntityType,
  auditEntityId,
  onBack,
}: DeliveryItemDetailSecondaryPanelsProps) {
  const base = `/projects/${projectId}/products/${productId}`;

  return (
    <div className="space-y-4 px-5 py-5 sm:px-7">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 text-xs"
        onClick={onBack}
      >
        ← Back to delivery summary
      </Button>

      {view === 'workspace' ? (
        <SecondaryCard title="Work Space">
          <p className="text-muted-foreground text-sm">
            Kanban, task creation, and execution controls live on the product Work Space tab.
          </p>
          <Link
            href={`${base}?tab=tasks`}
            className="text-primary mt-3 inline-block text-sm font-semibold hover:underline"
          >
            Open Work Space →
          </Link>
        </SecondaryCard>
      ) : null}

      {view === 'calls' ? (
        <SecondaryCard title="Calls">
          <p className="text-muted-foreground text-sm">
            Call history for this delivery line is not wired to the board yet. The Calls API is
            still in progress; this tab will show filtered CRM calls when it is ready.
          </p>
        </SecondaryCard>
      ) : null}

      {view === 'bonus' ? (
        <SecondaryCard title="Bonus">
          <p className="text-muted-foreground text-sm">
            Bonus breakdown for this line is not available in the sheet yet. The Bonus API is still
            in progress; use Finance on the product for payout context in the meantime.
          </p>
          <Link
            href={`${base}?tab=finance`}
            className="text-primary mt-3 inline-block text-sm font-semibold hover:underline"
          >
            Open Finance tab →
          </Link>
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
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <h4 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}
