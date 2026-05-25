import Link from 'next/link';

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
      <ul className="space-y-2 text-sm">
        <li>
          <Link href={projectHubHref} className="text-primary font-semibold hover:underline">
            Open project →
          </Link>
        </li>
        {openDealHref ? (
          <li>
            <Link href={openDealHref} className="text-primary font-semibold hover:underline">
              Open linked deal{dealCode ? ` (${dealCode})` : ''} →
            </Link>
          </li>
        ) : null}
        <li>
          <Link href="/crm/deals" className="text-primary font-semibold hover:underline">
            Deal pipeline →
          </Link>
        </li>
      </ul>
    </div>
  );
}
