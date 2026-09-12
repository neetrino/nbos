'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Deal } from '@/lib/api/deals';
import { resolveDealWhatsAppBindId } from '../deal-whatsapp-bind-id';
import type { DealWonWhatsAppPayload } from '../deal-won-whatsapp-gate';
import { useWonWhatsAppGate } from '../hooks/use-won-whatsapp-gate';
import { WhatsAppGroupSearchPicker } from './WhatsAppGroupSearchPicker';

interface WonWhatsAppGatePanelProps {
  deal: Deal;
  open: boolean;
  onSatisfiedChange: (satisfied: boolean, payload: DealWonWhatsAppPayload | null) => void;
}

export function WonWhatsAppGatePanel({ deal, open, onSatisfiedChange }: WonWhatsAppGatePanelProps) {
  const t = useTranslations('crm');
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
      <p className="text-sm font-medium">{t('dealSheet.whatsapp.gateTitle')}</p>
      <WonWhatsAppGateCopy createFailed={createFailed} hasDealGroup={hasDealGroup} />
      {hasDealGroup ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((open) => !open)}
        >
          {showAdvanced ? t('dealSheet.whatsapp.hideOptions') : t('dealSheet.whatsapp.needDifferent')}
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
  const t = useTranslations('crm');
  return (
    <>
      {props.hasDealGroup ? (
        <p className="text-muted-foreground text-xs">{t('dealSheet.whatsapp.gateHasGroup')}</p>
      ) : (
        <p className="text-muted-foreground text-xs">{t('dealSheet.whatsapp.gateNeedGroup')}</p>
      )}
      {props.createFailed ? (
        <p className="text-destructive text-xs">{t('dealSheet.whatsapp.gateCreateFailed')}</p>
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
  const t = useTranslations('crm');
  const bindId = resolveDealWhatsAppBindId(input.groupIdInput);
  const createLabel = input.createInFlight
    ? t('dealSheet.whatsapp.creatingGroup')
    : input.createFailed
      ? t('dealSheet.whatsapp.retryCreateGroup')
      : input.hasDealGroup
        ? t('dealSheet.whatsapp.createSeparate')
        : t('dealSheet.whatsapp.createGroupCta');
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={input.busy || input.createInFlight}
        onClick={input.onCreate}
      >
        {createLabel}
      </Button>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor="wa-directory-search">{t('dealSheet.whatsapp.findGroup')}</Label>
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
          {t('dealSheet.whatsapp.bindDifferent')}
        </Button>
      </div>
    </div>
  );
}
