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
  const [groupChatId, setGroupChatId] = useState<string | null>(null);
  const [createOperationStatus, setCreateOperationStatus] = useState<string | null>(null);
  const [createFailed, setCreateFailed] = useState(false);

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
      const payload = toWonWhatsAppPayload(nextAction, nextGroupId, groupIdInput);
      onSatisfiedChange(satisfied, payload);
    },
    [deal.type, groupIdInput, onSatisfiedChange],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadWonWhatsAppExisting(productId, (nextGroupId, nextCreateStatus) => {
      if (cancelled) return;
      setGroupChatId(nextGroupId);
      setCreateOperationStatus(nextCreateStatus);
      publish(null, nextGroupId, nextCreateStatus);
    });
    return () => {
      cancelled = true;
    };
  }, [open, productId, publish]);

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
  productId: string | null,
  onLoaded: (groupChatId: string | null, createStatus: string | null) => void,
): Promise<void> {
  if (!productId) {
    onLoaded(null, null);
    return;
  }
  try {
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
    if (input.productId) {
      const state = await dealWhatsAppApi.ensure(input.dealId);
      const nextStatus = state.latestOperation?.status ?? 'PENDING';
      input.setCreateOperationStatus(nextStatus);
      input.setCreateFailed(nextStatus === 'FAILED');
      input.setSessionAction('create');
      input.publish('create', input.groupChatId, nextStatus);
      toast.success(
        nextStatus === 'FAILED'
          ? 'Group creation failed. You can still mark the deal as Won and retry later.'
          : 'WhatsApp group creation started.',
      );
      return;
    }
    input.setSessionAction('create');
    input.publish('create', input.groupChatId, input.createOperationStatus);
    toast.success(
      'Create group selected. Mark as Won will start creation after the product exists.',
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
    if (input.productId) {
      const state = await productWhatsAppApi.bind(input.productId, {
        groupChatId: input.pasted,
        persistIfUnreachable: true,
      });
      const nextId = state.binding?.groupChatId ?? input.pasted;
      input.setGroupChatId(nextId);
      input.setSessionAction('bind');
      input.publish('bind', nextId, input.createOperationStatus);
      toast.success('WhatsApp group ID saved.');
      return;
    }
    input.setGroupChatId(input.pasted);
    input.setSessionAction('bind');
    input.publish('bind', input.pasted, input.createOperationStatus);
    toast.success('Group ID will be saved when the product is created on Won.');
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Could not save WhatsApp group ID.'));
  } finally {
    input.setBusy(false);
  }
}
