'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CallActivity } from '@/lib/api/calls';
import { CallActivityDetails } from './CallActivityDetails';
import { callActivityTitle } from './group-call-activities';

export function CallActivityDetailsDialog(props: {
  call: CallActivity | null;
  onClose: () => void;
}) {
  const { call, onClose } = props;

  return (
    <Dialog open={call != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" forceNestedBackdrop showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="text-primary size-[18px] shrink-0" aria-hidden />
            {call ? callActivityTitle(call.direction) : 'Call'}
          </DialogTitle>
        </DialogHeader>
        {call ? <CallActivityDetails call={call} /> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
