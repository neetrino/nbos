'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Deal } from '@/lib/api/deals';
import type { DealWonWhatsAppPayload } from '../deal-won-whatsapp-gate';
import { useWonWhatsAppGate } from '../hooks/use-won-whatsapp-gate';
import { whatsappCreateButtonLabel } from '../whatsapp-create-status';

interface WonWhatsAppGatePanelProps {
  deal: Deal;
  open: boolean;
  onSatisfiedChange: (satisfied: boolean, payload: DealWonWhatsAppPayload | null) => void;
}

export function WonWhatsAppGatePanel({ deal, open, onSatisfiedChange }: WonWhatsAppGatePanelProps) {
  const {
    groupIdInput,
    setGroupIdInput,
    busy,
    createFailed,
    createInFlight,
    hasDealGroup,
    showAdvanced,
    setShowAdvanced,
    handleCreate,
    handleSaveId,
  } = useWonWhatsAppGate(deal, open, onSatisfiedChange);

  return (
    <div className="border-border space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">WhatsApp group</p>
      {hasDealGroup ? (
        <p className="text-muted-foreground text-xs">
          This deal already has a client group. It will be attached as Product WORK. History is not
          copied.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Create a group or paste an existing group ID. There is no skip — Mark as Won stays off
          until you choose one.
        </p>
      )}
      {createFailed ? (
        <p className="text-destructive text-xs">
          Creation failed (WhatsApp may be down). You can still mark as Won and retry later.
        </p>
      ) : null}
      {hasDealGroup ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced((open) => !open)}>
          {showAdvanced ? 'Hide other options' : 'Need a different group?'}
        </Button>
      ) : null}
      {!hasDealGroup || showAdvanced ? (
        <WonWhatsAppAdvancedActions
          busy={busy}
          createFailed={createFailed}
          createInFlight={createInFlight}
          groupIdInput={groupIdInput}
          hasDealGroup={hasDealGroup}
          onCreate={() => void handleCreate()}
          onGroupIdChange={setGroupIdInput}
          onSaveId={() => void handleSaveId()}
        />
      ) : null}
    </div>
  );
}

function WonWhatsAppAdvancedActions(input: {
  busy: boolean;
  createFailed: boolean;
  createInFlight: boolean;
  groupIdInput: string;
  hasDealGroup: boolean;
  onCreate: () => void;
  onGroupIdChange: (value: string) => void;
  onSaveId: () => void;
}) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={input.busy || input.createInFlight}
        onClick={input.onCreate}
      >
        {whatsappCreateButtonLabel({
          inFlight: input.createInFlight,
          failed: input.createFailed,
          idleLabel: input.hasDealGroup ? 'Create a separate delivery group' : 'Create WhatsApp group',
        })}
      </Button>
      <div className="space-y-1.5">
        <Label htmlFor="won-wa-group-id">WhatsApp group ID</Label>
        <Input
          id="won-wa-group-id"
          value={input.groupIdInput}
          onChange={(event) => input.onGroupIdChange(event.target.value)}
          placeholder="120363… or 120363…@g.us"
          disabled={input.busy}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={input.busy || !input.groupIdInput.trim()}
          onClick={input.onSaveId}
        >
          Bind a different group
        </Button>
      </div>
    </div>
  );
}
