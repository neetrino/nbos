'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DealWhatsAppBindDialogProps {
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (groupChatId: string) => Promise<void>;
}

export function DealWhatsAppBindDialog({
  open,
  busy,
  onOpenChange,
  onSubmit,
}: DealWhatsAppBindDialogProps) {
  const [groupChatId, setGroupChatId] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setGroupChatId('');
        onOpenChange(next);
      }}
    >
      <DialogContent forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>Bind existing WhatsApp group</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="deal-wa-bind-id">WhatsApp group ID</Label>
          <Input
            id="deal-wa-bind-id"
            value={groupChatId}
            onChange={(event) => setGroupChatId(event.target.value)}
            placeholder="120363… or 120363…@g.us"
            disabled={busy}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !groupChatId.trim()}
            onClick={() => void onSubmit(groupChatId.trim())}
          >
            Bind group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
