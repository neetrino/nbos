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
import { Label } from '@/components/ui/label';
import { resolveDealWhatsAppBindId } from '../deal-whatsapp-bind-id';
import { WhatsAppGroupSearchPicker } from './WhatsAppGroupSearchPicker';

interface DealWhatsAppBindDialogProps {
  dealId: string;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (groupChatId: string) => Promise<void>;
}

export function DealWhatsAppBindDialog({
  dealId,
  open,
  busy,
  onOpenChange,
  onSubmit,
}: DealWhatsAppBindDialogProps) {
  const [search, setSearch] = useState('');
  const bindId = resolveDealWhatsAppBindId(search);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('');
        onOpenChange(next);
      }}
    >
      <DialogContent
        forceNestedBackdrop
        className="min-w-0 [grid-template-columns:minmax(0,1fr)] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Bind existing WhatsApp group</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="wa-directory-search">Find existing group</Label>
          <WhatsAppGroupSearchPicker
            dealId={dealId}
            open={open}
            disabled={busy}
            selectedId={bindId}
            search={search}
            onSearchChange={setSearch}
            onSelect={(groupChatId) => void onSubmit(groupChatId)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !bindId}
            onClick={() => {
              if (!bindId) return;
              void onSubmit(bindId);
            }}
          >
            Bind group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
