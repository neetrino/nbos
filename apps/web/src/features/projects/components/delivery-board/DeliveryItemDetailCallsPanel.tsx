import { FileText, FolderKanban, LayoutGrid } from 'lucide-react';
import { EntityNavPillLink } from '@/components/shared';

export function DeliveryItemDetailCallsPanel({
  projectHubHref,
  openDealHref,
  dealCode,
}: {
  projectHubHref: string;
  openDealHref: string | null;
  dealCode: string | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Call logging integrated with this board is not implemented yet. There is no persisted call
        timeline per delivery line in NBOS today.
      </p>
      <p className="text-muted-foreground text-sm">
        Use the project and CRM deal for client conversations until telephony or activity APIs are
        connected.
      </p>
      <ul className="flex flex-col items-start gap-2">
        <li>
          <EntityNavPillLink href={projectHubHref} label="Open project" icon={FolderKanban} />
        </li>
        {openDealHref ? (
          <li>
            <EntityNavPillLink
              href={openDealHref}
              label={dealCode ? `Open linked deal (${dealCode})` : 'Open linked deal'}
              icon={FileText}
            />
          </li>
        ) : null}
        <li>
          <EntityNavPillLink href="/crm/deals" label="Deal pipeline" icon={LayoutGrid} />
        </li>
      </ul>
    </div>
  );
}
