'use client';

import { useState } from 'react';
import { Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Subscription } from '@/lib/api/finance';
import { SubscriptionPartnerDialog } from './SubscriptionPartnerDialog';

interface SubscriptionDetailActionsProps {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
  onError: (message: string | null) => void;
}

/** Partner action for the detail aside — status changes live on the sheet header control. */
export function SubscriptionDetailActions({
  subscription,
  onSubscriptionChange,
  onError,
}: SubscriptionDetailActionsProps) {
  const [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPartnerOpen(true)}>
          <Handshake size={14} />
          Partner
        </Button>
      </div>

      <SubscriptionPartnerDialog
        subscription={subscription}
        open={partnerOpen}
        onOpenChange={setPartnerOpen}
        forceNestedBackdrop
        onSaved={(updated) => {
          onSubscriptionChange(updated);
          onError(null);
        }}
      />
    </>
  );
}
