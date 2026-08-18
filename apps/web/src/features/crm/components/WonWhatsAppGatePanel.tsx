'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Deal } from '@/lib/api/deals';
import type { DealWonWhatsAppPayload } from '../deal-won-whatsapp-gate';
import { useWonWhatsAppGate } from '../hooks/use-won-whatsapp-gate';

interface WonWhatsAppGatePanelProps {
  deal: Deal;
  open: boolean;
  onSatisfiedChange: (satisfied: boolean, payload: DealWonWhatsAppPayload | null) => void;
}

export function WonWhatsAppGatePanel({ deal, open, onSatisfiedChange }: WonWhatsAppGatePanelProps) {
  const { groupIdInput, setGroupIdInput, busy, createFailed, handleCreate, handleSaveId } =
    useWonWhatsAppGate(deal, open, onSatisfiedChange);

  return (
    <div className="border-border space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">WhatsApp group</p>
      <p className="text-muted-foreground text-xs">
        Create a group or paste an existing group ID. There is no skip — Mark as Won stays off until
        you choose one.
      </p>
      {createFailed ? (
        <p className="text-destructive text-xs">
          Creation failed (WhatsApp may be down). You can still mark as Won and retry later.
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy}
        onClick={() => void handleCreate()}
      >
        Create WhatsApp group
      </Button>
      <div className="space-y-1.5">
        <Label htmlFor="won-wa-group-id">WhatsApp group ID</Label>
        <Input
          id="won-wa-group-id"
          value={groupIdInput}
          onChange={(event) => setGroupIdInput(event.target.value)}
          placeholder="120363… or 120363…@g.us"
          disabled={busy}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy || !groupIdInput.trim()}
          onClick={() => void handleSaveId()}
        >
          Save group ID
        </Button>
      </div>
    </div>
  );
}
