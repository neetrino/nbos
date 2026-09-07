'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Deal } from '@/lib/api/deals';
import { resolveDealWhatsAppBindId } from '../deal-whatsapp-bind-id';
import type { DealWonWhatsAppPayload } from '../deal-won-whatsapp-gate';
import { useWonWhatsAppGate } from '../hooks/use-won-whatsapp-gate';
import { whatsappCreateButtonLabel } from '../whatsapp-create-status';
import { WhatsAppGroupSearchPicker } from './WhatsAppGroupSearchPicker';

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
  const pickerOpen = open && (!hasDealGroup || showAdvanced);

  return (
    <div className="border-border space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">WhatsApp group</p>
      <WonWhatsAppGateCopy createFailed={createFailed} hasDealGroup={hasDealGroup} />
      {hasDealGroup ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((open) => !open)}
        >
          {showAdvanced ? 'Hide other options' : 'Need a different group?'}
        </Button>
      ) : null}
      {pickerOpen ? (
        <WonWhatsAppAdvancedActions
          busy={busy}
          createFailed={createFailed}
          createInFlight={createInFlight}
          dealId={deal.id}
          groupIdInput={groupIdInput}
          hasDealGroup={hasDealGroup}
          pickerOpen={pickerOpen}
          onCreate={() => void handleCreate()}
          onGroupIdChange={setGroupIdInput}
          onSaveId={(id) => void handleSaveId(id)}
        />
      ) : null}
    </div>
  );
}

function WonWhatsAppGateCopy(props: { createFailed: boolean; hasDealGroup: boolean }) {
  return (
    <>
      {props.hasDealGroup ? (
        <p className="text-muted-foreground text-xs">
          This deal already has a client group. It will be attached as Product WORK. History is not
          copied.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Create a group or search by name or ID and select one. There is no skip — Mark as Won
          stays off until you choose one.
        </p>
      )}
      {props.createFailed ? (
        <p className="text-destructive text-xs">
          Creation failed (WhatsApp may be down). You can still mark as Won and retry later.
        </p>
      ) : null}
    </>
  );
}

function WonWhatsAppAdvancedActions(input: {
  busy: boolean;
  createFailed: boolean;
  createInFlight: boolean;
  dealId: string;
  groupIdInput: string;
  hasDealGroup: boolean;
  pickerOpen: boolean;
  onCreate: () => void;
  onGroupIdChange: (value: string) => void;
  onSaveId: (groupChatId?: string) => void;
}) {
  const bindId = resolveDealWhatsAppBindId(input.groupIdInput);
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
          idleLabel: input.hasDealGroup
            ? 'Create a separate delivery group'
            : 'Create WhatsApp group',
        })}
      </Button>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor="wa-directory-search">Find existing group</Label>
        <WhatsAppGroupSearchPicker
          dealId={input.dealId}
          open={input.pickerOpen}
          disabled={input.busy}
          selectedId={bindId}
          search={input.groupIdInput}
          onSearchChange={input.onGroupIdChange}
          onSelect={(groupChatId) => input.onSaveId(groupChatId)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={input.busy || !bindId}
          onClick={() => input.onSaveId(bindId ?? undefined)}
        >
          Bind a different group
        </Button>
      </div>
    </div>
  );
}
