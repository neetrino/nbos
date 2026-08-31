'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Deal } from '@/lib/api/deals';
import { dealWhatsAppApi, productWhatsAppApi } from '@/lib/api/whatsapp';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  canConfirmDealWonWhatsApp,
  type DealWonWhatsAppPayload,
  type DealWonWhatsAppSessionAction,
} from '../deal-won-whatsapp-gate';
import { isWhatsAppCreateInFlight } from '../whatsapp-create-status';

export function resolveDealProductIdForWhatsApp(deal: Deal): string | null {
  if (deal.existingProductId) return deal.existingProductId;
  const order = deal.orders?.find((row) => Boolean(row.productId));
  return order?.productId ?? null;
}

export function useWonWhatsAppGate(
  deal: Deal,
  open: boolean,
  onSatisfiedChange: (satisfied: boolean, payload: DealWonWhatsAppPayload | null) => void,
) {
  const productId = resolveDealProductIdForWhatsApp(deal);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionAction, setSessionAction] = useState<DealWonWhatsAppSessionAction | null>(null);
  const [groupChatId, setGroupChatId] = useState<string | null>(
    deal.whatsappGroupBinding?.groupChatId ?? null,
  );
  const [createOperationStatus, setCreateOperationStatus] = useState<string | null>(
    deal.whatsappGroupBinding?.status ?? null,
  );
  const [createFailed, setCreateFailed] = useState(deal.whatsappGroupBinding?.status === 'FAILED');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const publish = useCallback(
    (
      nextAction: DealWonWhatsAppSessionAction | null,
      nextGroupId: string | null,
      nextCreateStatus: string | null,
    ) => {
      const satisfied = canConfirmDealWonWhatsApp({
        dealType: deal.type,
        groupChatId: nextGroupId,
        createOperationStatus: nextCreateStatus,
        sessionAction: nextAction,
      });
      onSatisfiedChange(satisfied, toWonWhatsAppPayload(nextAction, nextGroupId, groupIdInput));
    },
    [deal.type, groupIdInput, onSatisfiedChange],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadWonWhatsAppExisting(deal.id, productId, (nextGroupId, nextCreateStatus) => {
      if (cancelled) return;
      setGroupChatId(nextGroupId);
      setCreateOperationStatus(nextCreateStatus);
      setCreateFailed(nextCreateStatus === 'FAILED');
      const defaultAction = nextGroupId ? 'bind' : null;
      publish(defaultAction, nextGroupId, nextCreateStatus);
    });
    return () => {
      cancelled = true;
    };
  }, [deal.id, open, productId, publish]);

  const handleCreate = () =>
    runCreateWhatsApp({
      dealId: deal.id,
      productId,
      groupChatId,
      createOperationStatus,
      publish,
      setBusy,
      setCreateFailed,
      setCreateOperationStatus,
      setSessionAction,
    });

  const handleSaveId = () =>
    runSaveWhatsAppId({
      dealId: deal.id,
      productId,
      pasted: groupIdInput.trim(),
      createOperationStatus,
      publish,
      setBusy,
      setGroupChatId,
      setSessionAction,
    });

  return {
    groupIdInput,
    setGroupIdInput,
    busy,
    createFailed,
    createInFlight: isWhatsAppCreateInFlight(createOperationStatus),
    hasDealGroup: Boolean(groupChatId),
    showAdvanced,
    setShowAdvanced,
    handleCreate,
    handleSaveId,
    sessionAction,
  };
}

function toWonWhatsAppPayload(
  action: DealWonWhatsAppSessionAction | null,
  groupId: string | null,
  input: string,
): DealWonWhatsAppPayload | null {
  if (action === 'bind') return { action: 'bind', groupChatId: groupId ?? input.trim() };
  if (action === 'create') return { action: 'create' };
  return null;
}

async function loadWonWhatsAppExisting(
  dealId: string,
  productId: string | null,
  onLoaded: (groupChatId: string | null, createStatus: string | null) => void,
): Promise<void> {
  try {
    const dealState = await dealWhatsAppApi.getState(dealId);
    const dealGroupId = dealState.binding?.groupChatId ?? null;
    const dealStatus = dealState.binding?.status ?? dealState.latestOperation?.status ?? null;
    if (dealGroupId || dealStatus) {
      onLoaded(dealGroupId, dealStatus);
      return;
    }
    if (!productId) {
      onLoaded(null, null);
      return;
    }
    const [state, operations] = await Promise.all([
      productWhatsAppApi.getState(productId),
      productWhatsAppApi.operations(productId),
    ]);
    const createOp = operations.items.find((item) => item.type === 'CREATE_PRODUCT_GROUP');
    onLoaded(state.binding?.groupChatId ?? null, createOp?.status ?? null);
  } catch {
    onLoaded(null, null);
  }
}

async function runCreateWhatsApp(input: {
  dealId: string;
  productId: string | null;
  groupChatId: string | null;
  createOperationStatus: string | null;
  publish: (
    action: DealWonWhatsAppSessionAction | null,
    groupId: string | null,
    createStatus: string | null,
  ) => void;
  setBusy: (busy: boolean) => void;
  setCreateFailed: (failed: boolean) => void;
  setCreateOperationStatus: (status: string | null) => void;
  setSessionAction: (action: DealWonWhatsAppSessionAction | null) => void;
}): Promise<void> {
  input.setBusy(true);
  try {
    const state = await dealWhatsAppApi.ensure(input.dealId);
    const nextStatus = state.latestOperation?.status ?? state.binding?.status ?? 'PENDING';
    input.setCreateOperationStatus(nextStatus);
    input.setCreateFailed(nextStatus === 'FAILED');
    input.setSessionAction('create');
    input.publish('create', state.binding?.groupChatId ?? input.groupChatId, nextStatus);
    toast.success(
      nextStatus === 'FAILED'
        ? 'Group creation failed. You can still mark the deal as Won and retry later.'
        : 'WhatsApp group creation started.',
    );
  } catch (error) {
    input.setSessionAction('create');
    input.setCreateFailed(true);
    input.publish('create', input.groupChatId, input.createOperationStatus);
    toast.error(
      getApiErrorMessage(error, 'Group creation failed. You can still mark the deal as Won.'),
    );
  } finally {
    input.setBusy(false);
  }
}

async function runSaveWhatsAppId(input: {
  dealId: string;
  productId: string | null;
  pasted: string;
  createOperationStatus: string | null;
  publish: (
    action: DealWonWhatsAppSessionAction | null,
    groupId: string | null,
    createStatus: string | null,
  ) => void;
  setBusy: (busy: boolean) => void;
  setGroupChatId: (id: string | null) => void;
  setSessionAction: (action: DealWonWhatsAppSessionAction | null) => void;
}): Promise<void> {
  if (!input.pasted) return;
  input.setBusy(true);
  try {
    const state = await dealWhatsAppApi.bind(input.dealId, {
      groupChatId: input.pasted,
      persistIfUnreachable: true,
    });
    const nextId = state.binding?.groupChatId ?? input.pasted;
    input.setGroupChatId(nextId);
    input.setSessionAction('bind');
    input.publish('bind', nextId, input.createOperationStatus);
    toast.success('WhatsApp group ID saved.');
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Could not save WhatsApp group ID.'));
  } finally {
    input.setBusy(false);
  }
}
