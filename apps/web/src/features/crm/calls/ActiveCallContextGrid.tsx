'use client';

import type { ReactNode } from 'react';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { getDealStage } from '@/features/crm/constants/dealPipeline';

export function ActiveCallContextGrid({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const contactName = snapshot?.contact.name ?? null;
  const dealName = snapshot?.deal.name ?? null;
  const projectName = snapshot?.projectName ?? null;
  const productName = snapshot?.productName ?? null;
  const dealStage = snapshot?.deal.stage
    ? (getDealStage(snapshot.deal.stage)?.label ?? null)
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ContextCard title="Contact">
        <ContextLine label="Name" value={contactName} empty="New caller" />
        <ContextLine label="Company" value={snapshot?.contact.companyName ?? null} />
        <ContextLine
          label="Phones"
          value={snapshot?.contact.phones.length ? snapshot.contact.phones.join(', ') : null}
        />
      </ContextCard>
      <ContextCard title="Deal">
        <ContextLine label="Name" value={dealName} empty="No open deal" />
        <ContextLine label="Stage" value={dealStage} />
        <ContextLine label="Amount" value={snapshot?.deal.amount ?? null} />
      </ContextCard>
      <ContextCard title="Project / Product">
        <ContextLine label="Project" value={projectName} empty="Not linked" />
        <ContextLine label="Product" value={productName} empty="Not linked" />
      </ContextCard>
      <ContextCard title="Recent calls">
        <RecentCalls snapshot={snapshot} />
      </ContextCard>
    </div>
  );
}

function ContextCard(props: { title: string; children: ReactNode }) {
  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">{props.title}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">{props.children}</dl>
    </section>
  );
}

function ContextLine(props: { label: string; value: string | null; empty?: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{props.label}</dt>
      <dd className="text-foreground font-medium">{props.value ?? props.empty ?? '—'}</dd>
    </>
  );
}

function RecentCalls({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const items = snapshot?.recentCalls ?? [];
  if (items.length === 0) {
    return (
      <>
        <dt className="text-muted-foreground">History</dt>
        <dd className="text-foreground font-medium">—</dd>
      </>
    );
  }
  return (
    <>
      {items.map((item) => (
        <ContextLine
          key={item.id}
          label={item.direction === 'OUTBOUND' ? 'OUT' : 'IN'}
          value={item.phase}
        />
      ))}
    </>
  );
}
