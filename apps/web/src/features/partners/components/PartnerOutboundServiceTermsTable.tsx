'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { PartnerServiceTerm } from '@/lib/api/partners';
import type { Project } from '@/lib/api/projects';

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

export function PartnerOutboundServiceTermsTable(props: {
  rows: PartnerServiceTerm[];
  projectById: Map<string, Project>;
  creatingFinanceId: string | null;
  onCreateFinance: (termId: string) => void;
}) {
  const { rows, projectById, creatingFinanceId, onCreateFinance } = props;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse text-left text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-xs tracking-wide uppercase">
            <th className="pr-3 pb-2 font-medium">Created</th>
            <th className="pr-3 pb-2 font-medium">Type</th>
            <th className="pr-3 pb-2 font-medium">Model</th>
            <th className="pr-3 pb-2 text-right font-medium">Amount</th>
            <th className="pr-3 pb-2 font-medium">Project</th>
            <th className="pr-3 pb-2 font-medium">Invoice</th>
            <th className="pr-3 pb-2 font-medium">Subscription</th>
            <th className="pr-3 pb-2 font-medium">Status</th>
            <th className="pb-2 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const canMaterialize =
              !row.invoiceId &&
              !row.subscriptionId &&
              row.status !== 'CANCELLED' &&
              row.status !== 'COMPLETED';
            const proj = row.projectId ? projectById.get(row.projectId) : undefined;
            return (
              <tr key={row.id} className="border-border border-b last:border-0">
                <td className="text-muted-foreground py-2 pr-3 align-top text-xs tabular-nums">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="py-2 pr-3 align-top">{row.serviceType}</td>
                <td className="py-2 pr-3 align-top">{row.paymentModel}</td>
                <td className="py-2 pr-3 text-right align-top font-medium tabular-nums">
                  {row.amount}
                </td>
                <td className="py-2 pr-3 align-top text-xs">
                  {row.projectId ? (
                    <Link
                      href={`/projects/${row.projectId}`}
                      className="text-primary hover:underline"
                    >
                      {proj ? `${proj.code} · ${proj.name}` : `${row.projectId.slice(0, 8)}…`}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 pr-3 align-top font-mono text-xs">
                  {row.invoiceId ? `${row.invoiceId.slice(0, 8)}…` : '—'}
                </td>
                <td className="py-2 pr-3 align-top font-mono text-xs">
                  {row.subscriptionId ? `${row.subscriptionId.slice(0, 8)}…` : '—'}
                </td>
                <td className="py-2 pr-3 align-top text-xs capitalize">
                  {statusLabel(row.status)}
                </td>
                <td className="py-2 text-right align-top">
                  {canMaterialize ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={creatingFinanceId !== null}
                      onClick={() => void onCreateFinance(row.id)}
                    >
                      {creatingFinanceId === row.id ? 'Creating…' : 'Create finance'}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
