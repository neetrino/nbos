'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Deal } from '@/lib/api/deals';
import { dealWhatsAppApi, type DealWhatsAppState } from '@/lib/api/whatsapp';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { buildDealWhatsAppQuickActions } from '../deal-whatsapp-quick-action';

export function useDealWhatsAppHeaderActions(deal: Deal, onRefresh?: () => void) {
  const remote = useDealWhatsAppRemoteState(deal);
  const mutations = useDealWhatsAppMutations(deal.id, remote.setWhatsappState, onRefresh);
  const whatsappActions = useDealWhatsAppActionItems(deal, {
    bindingStatus: remote.bindingStatus,
    groupChatId: remote.groupChatId,
    latestOperationStatus: remote.latestOperationStatus,
    handleBindOpen: mutations.setBindOpen,
    handleEnsure: mutations.handleEnsureWhatsApp,
    stateReady: remote.stateReady,
    whatsappBusy: mutations.whatsappBusy,
  });
  return {
    bindOpen: mutations.bindOpen,
    handleBindWhatsApp: mutations.handleBindWhatsApp,
    setBindOpen: mutations.setBindOpen,
    whatsappActions,
    whatsappBusy: mutations.whatsappBusy,
  };
}

function dealWhatsAppFetchKey(deal: Deal): string {
  return `${deal.id}:${deal.whatsappGroupBinding?.status ?? ''}:${deal.whatsappGroupBinding?.groupChatId ?? ''}`;
}

function useDealWhatsAppRemoteState(deal: Deal) {
  const fetchKey = dealWhatsAppFetchKey(deal);
  const [snapshot, setSnapshot] = useState<{
    key: string;
    ready: boolean;
    state: DealWhatsAppState | null;
  }>({ key: fetchKey, ready: false, state: null });

  useEffect(() => {
    let cancelled = false;
    void dealWhatsAppApi
      .getState(deal.id)
      .then((state) => {
        if (cancelled) return;
        setSnapshot({ key: fetchKey, ready: true, state });
      })
      .catch(() => {
        if (cancelled) return;
        setSnapshot({ key: fetchKey, ready: true, state: null });
      });
    return () => {
      cancelled = true;
    };
  }, [deal.id, fetchKey]);

  const matchesCurrentKey = snapshot.key === fetchKey;
  const whatsappState = matchesCurrentKey ? snapshot.state : null;
  const setWhatsappState = useCallback(
    (state: DealWhatsAppState) => {
      setSnapshot({ key: fetchKey, ready: true, state });
    },
    [fetchKey],
  );

  return {
    bindingStatus: whatsappState?.binding?.status ?? deal.whatsappGroupBinding?.status ?? null,
    groupChatId:
      whatsappState?.binding?.groupChatId ?? deal.whatsappGroupBinding?.groupChatId ?? null,
    latestOperationStatus: whatsappState?.latestOperation?.status,
    setWhatsappState,
    stateReady: matchesCurrentKey && snapshot.ready,
  };
}

function useDealWhatsAppMutations(
  dealId: string,
  setWhatsappState: (state: DealWhatsAppState) => void,
  onRefresh?: () => void,
) {
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);

  const handleEnsureWhatsApp = useCallback(async () => {
    if (whatsappBusy) return;
    setWhatsappBusy(true);
    try {
      const state = await dealWhatsAppApi.ensure(dealId);
      setWhatsappState(state);
      toast.success('WhatsApp group creation started.');
      onRefresh?.();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not start WhatsApp group creation.'));
    } finally {
      setWhatsappBusy(false);
    }
  }, [dealId, onRefresh, setWhatsappState, whatsappBusy]);

  const handleBindWhatsApp = useCallback(
    async (groupChatId: string) => {
      setWhatsappBusy(true);
      try {
        const state = await dealWhatsAppApi.bind(dealId, {
          groupChatId,
          persistIfUnreachable: true,
        });
        setWhatsappState(state);
        setBindOpen(false);
        toast.success('WhatsApp group bound to this deal.');
        onRefresh?.();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not bind WhatsApp group.'));
      } finally {
        setWhatsappBusy(false);
      }
    },
    [dealId, onRefresh, setWhatsappState],
  );

  return { bindOpen, handleBindWhatsApp, handleEnsureWhatsApp, setBindOpen, whatsappBusy };
}

type DealWhatsAppActionInput = {
  bindingStatus: string | null;
  groupChatId: string | null;
  latestOperationStatus: string | undefined;
  handleBindOpen: (open: boolean) => void;
  handleEnsure: () => Promise<void>;
  stateReady: boolean;
  whatsappBusy: boolean;
};

function useDealWhatsAppActionItems(deal: Deal, input: DealWhatsAppActionInput) {
  const router = useRouter();
  const productId = resolveDealProductId(deal);
  const projectId = deal.projectId ?? deal.orders?.[0]?.projectId;
  const contactId = deal.contactId ?? deal.contact?.id ?? null;

  return buildDealWhatsAppQuickActions({
    dealType: deal.type,
    contactId,
    productId,
    projectId,
    bindingStatus: input.bindingStatus,
    groupChatId: input.groupChatId,
    latestOperationStatus: input.latestOperationStatus,
    whatsappBusy: input.whatsappBusy,
    stateReady: input.stateReady,
    onEnsure: () => void input.handleEnsure(),
    onBind: () => input.handleBindOpen(true),
    onOpenSettings: (id) => {
      router.push(
        projectId ? `/projects/${projectId}/products/${id}?settings=whatsapp` : '/projects',
      );
    },
    onCopyGroupId: (id) => {
      void navigator.clipboard.writeText(id);
      toast.success('WhatsApp group ID copied.');
    },
  });
}

function resolveDealProductId(deal: Deal): string | null {
  if (deal.existingProductId) return deal.existingProductId;
  const orderWithProduct = deal.orders?.find((order) => Boolean(order.productId));
  return orderWithProduct?.productId ?? null;
}
