'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  messengerClientApi,
  type MessengerClientConversationRow,
} from '@/lib/api/messenger-core-client';
import {
  attentionScopeKey,
  attentionScopeLabel,
  viewedAttention,
  type ClientAttentionRow,
} from './client-attention-view';

const ATTENTION_OPTIONS = [
  { value: 'ROLE:PRODUCT_PM', label: 'Product PM' },
  { value: 'QUEUE:SUPPORT_INTAKE', label: 'Support Intake' },
  { value: 'QUEUE:FINANCE', label: 'Finance' },
] as const;

export function ClientAttentionAssign({
  conversation,
  viewedProductId,
  onAssigned,
}: {
  conversation: MessengerClientConversationRow;
  viewedProductId: string | null;
  onAssigned: (attention: NonNullable<MessengerClientConversationRow['attention']>) => void;
}) {
  const rows = conversation.attention;
  const initial = viewedAttention(rows, viewedProductId);
  const [scopeKey, setScopeKey] = useState(initial ? attentionScopeKey(initial) : '');
  const current = useMemo(
    () =>
      (rows ?? []).find((row) => attentionScopeKey(row) === scopeKey) ??
      viewedAttention(rows, viewedProductId),
    [rows, scopeKey, viewedProductId],
  );
  if (!current) return null;
  const showScope = (rows?.length ?? 0) > 1;
  return (
    <div className="flex max-w-[18rem] items-center gap-1">
      {showScope ? (
        <select
          aria-label="Attention product and purpose"
          className="max-w-[8.5rem] rounded-lg border border-teal-900/10 bg-[#F4F7F7] px-2 py-1 text-[11px] text-black"
          value={attentionScopeKey(current)}
          onChange={(event) => setScopeKey(event.target.value)}
        >
          {rows?.map((row) => (
            <option key={attentionScopeKey(row)} value={attentionScopeKey(row)}>
              {attentionScopeLabel(row)}
            </option>
          ))}
        </select>
      ) : null}
      <select
        aria-label="Reassign attention"
        className="max-w-[9.5rem] rounded-lg border border-teal-900/10 bg-[#F4F7F7] px-2 py-1 text-[11px] text-black"
        value={selectedAttentionValue(current)}
        onChange={(event) =>
          void submitAttentionAssign(conversation.id, current, event.target.value, onAssigned)
        }
      >
        {ATTENTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function selectedAttentionValue(current: ClientAttentionRow): string {
  if (current.ownerQueue) return `QUEUE:${current.ownerQueue}`;
  if (current.ownerKind === 'ROLE') return 'ROLE:PRODUCT_PM';
  return '';
}

async function submitAttentionAssign(
  conversationId: string,
  current: ClientAttentionRow,
  value: string,
  onAssigned: (attention: NonNullable<MessengerClientConversationRow['attention']>) => void,
): Promise<void> {
  const body = attentionBodyFromSelect(current, value);
  if (!body) return;
  try {
    const attention = await messengerClientApi.assignAttention(conversationId, body);
    onAssigned(attention);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Attention could not be reassigned.'));
  }
}

function attentionBodyFromSelect(current: ClientAttentionRow, value: string) {
  if (value === 'ROLE:PRODUCT_PM') {
    return { productId: current.productId, purpose: current.purpose, ownerKind: 'ROLE' as const };
  }
  if (value === 'QUEUE:SUPPORT_INTAKE') {
    return {
      productId: current.productId,
      purpose: current.purpose,
      ownerKind: 'QUEUE' as const,
      ownerQueue: 'SUPPORT_INTAKE' as const,
    };
  }
  if (value === 'QUEUE:FINANCE') {
    return {
      productId: current.productId,
      purpose: current.purpose,
      ownerKind: 'QUEUE' as const,
      ownerQueue: 'FINANCE' as const,
    };
  }
  return null;
}
