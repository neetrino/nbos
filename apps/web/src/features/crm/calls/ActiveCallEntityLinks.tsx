'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { incomingCallCrmHref } from './incoming-call-href';

export function ActiveCallEntityLinks({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const router = useRouter();
  if (!snapshot) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <EntityLink
        label="Open Lead"
        href={incomingCallCrmHref({ leadId: snapshot.leadId, contactId: null, dealId: null })}
        onOpen={router.push}
      />
      <EntityLink
        label="Open Contact"
        href={incomingCallCrmHref({ leadId: null, contactId: snapshot.contact.id, dealId: null })}
        onOpen={router.push}
      />
      <EntityLink
        label="Open Deal"
        href={incomingCallCrmHref({ leadId: null, contactId: null, dealId: snapshot.deal.id })}
        onOpen={router.push}
      />
    </div>
  );
}

function EntityLink(props: { label: string; href: string | null; onOpen: (href: string) => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!props.href}
      onClick={() => {
        if (props.href) props.onOpen(props.href);
      }}
    >
      {props.label}
    </Button>
  );
}
