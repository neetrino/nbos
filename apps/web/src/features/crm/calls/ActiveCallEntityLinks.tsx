'use client';

import { useRouter } from 'next/navigation';
import { Handshake, LayoutGrid, User, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { incomingCallCrmHref } from './incoming-call-href';

export function ActiveCallEntityLinks({ snapshot }: { snapshot: ActiveCallScreenSnapshot | null }) {
  const router = useRouter();
  if (!snapshot) return null;

  return (
    <div className="border-border/60 bg-muted/40 flex flex-wrap gap-2 border-t px-5 py-3 sm:px-6">
      <EntityLink
        label="Open Lead"
        icon={LayoutGrid}
        href={incomingCallCrmHref({ leadId: snapshot.leadId, contactId: null, dealId: null })}
        onOpen={router.push}
      />
      <EntityLink
        label="Open Contact"
        icon={User}
        href={incomingCallCrmHref({ leadId: null, contactId: snapshot.contact.id, dealId: null })}
        onOpen={router.push}
      />
      <EntityLink
        label="Open Deal"
        icon={Handshake}
        href={incomingCallCrmHref({ leadId: null, contactId: null, dealId: snapshot.deal.id })}
        onOpen={router.push}
      />
    </div>
  );
}

function EntityLink(props: {
  label: string;
  icon: LucideIcon;
  href: string | null;
  onOpen: (href: string) => void;
}) {
  const Icon = props.icon;
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
      <Icon />
      {props.label}
    </Button>
  );
}
