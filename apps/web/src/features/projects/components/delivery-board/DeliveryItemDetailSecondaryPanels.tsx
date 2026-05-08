import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { DeliveryDetailSecondaryId } from './delivery-item-detail.constants';

interface DeliveryItemDetailSecondaryPanelsProps {
  view: DeliveryDetailSecondaryId;
  projectId: string;
  productId: string;
  onBack: () => void;
}

export function DeliveryItemDetailSecondaryPanels({
  view,
  projectId,
  productId,
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
            Client calls stay on CRM timelines. Filtered call history for this delivery line will
            appear here in a later slice (see Delivery Board canon §8.4).
          </p>
        </SecondaryCard>
      ) : null}

      {view === 'bonus' ? (
        <SecondaryCard title="Bonus">
          <p className="text-muted-foreground text-sm">
            Bonus entries follow Finance permissions. Use the product Finance tab for payout
            context; employee-facing wallet views stay under Finance → Wallet.
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
          <p className="text-muted-foreground text-sm">
            Immutable stage movement and audit history will be surfaced here when closed metadata is
            projected from the API (see implementation backlog).
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Until then, use the product page and Delivery Board stage gate actions with their logged
            outcomes.
          </p>
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
