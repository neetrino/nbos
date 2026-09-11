'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ClientLinkTicketDialog({
  open,
  onClose,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  onSubmit: (ticketId: string) => void;
}) {
  const [ticketId, setTicketId] = useState('');
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link support ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="link-ticket-id">Ticket id</Label>
          <Input
            id="link-ticket-id"
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || ticketId.trim().length === 0}
            onClick={() => onSubmit(ticketId.trim())}
          >
            Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
