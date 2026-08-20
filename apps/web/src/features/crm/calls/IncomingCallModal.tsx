'use client';

import { useRouter } from 'next/navigation';
import { PhoneIncoming } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { incomingCallCrmHref } from './incoming-call-href';
import type { IncomingCallPayload } from './incoming-call.types';

export function IncomingCallModal(props: {
  call: IncomingCallPayload | null;
  onClose: () => void;
}) {
  const { call, onClose } = props;
  const router = useRouter();
  const href = call ? incomingCallCrmHref(call) : null;

  return (
    <Dialog open={call != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneIncoming className="text-primary size-[18px] shrink-0" aria-hidden />
            Incoming call
          </DialogTitle>
        </DialogHeader>
        {call ? <IncomingCallDetails call={call} /> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!href}
            onClick={() => {
              if (!href) return;
              onClose();
              router.push(href);
            }}
          >
            Open CRM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncomingCallDetails({ call }: { call: IncomingCallPayload }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <IncomingCallField label="Phone" value={call.phone} />
      <IncomingCallField label="Contact" value={call.contactName} empty="New caller" />
      <IncomingCallField label="Lead" value={call.leadName} />
      <IncomingCallField label="Deal" value={call.dealName} empty="No open deal" />
      <IncomingCallField label="Responsible employee" value={call.responsibleEmployeeName} />
      <IncomingCallField label="Direction" value="Inbound" />
    </dl>
  );
}

function IncomingCallField(props: { label: string; value: string | null; empty?: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{props.label}</dt>
      <dd className="text-foreground font-medium">{props.value ?? props.empty ?? '—'}</dd>
    </>
  );
}
