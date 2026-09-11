'use client';

import { useCallback } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { WhatsAppGatewayDirectoryPicker } from '@/features/integrations/components/WhatsAppGatewayDirectoryPicker';
import { groupsPageToDirectoryPage } from '@/features/integrations/whatsapp-gateway-directory';
import { dealWhatsAppApi } from '@/lib/api/whatsapp';

interface WhatsAppGroupSearchPickerProps {
  dealId: string;
  open: boolean;
  disabled?: boolean;
  selectedId?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (groupChatId: string) => void;
}

export function WhatsAppGroupSearchPicker({
  dealId,
  open,
  disabled,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: WhatsAppGroupSearchPickerProps) {
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const loadPage = useCallback(
    async (params: { limit: number; offset: number; search: string }) => {
      const page = await dealWhatsAppApi.availableGroups(dealId, params);
      return groupsPageToDirectoryPage(page);
    },
    [dealId],
  );

  return (
    <WhatsAppGatewayDirectoryPicker
      open={open}
      configured
      compact
      search={search}
      onSearchChange={onSearchChange}
      debouncedSearch={debouncedSearch}
      disabled={disabled}
      selectedId={selectedId}
      loadPage={loadPage}
      onSelect={(item) => onSelect(item.id)}
      emptyMessage="No groups match this search."
    />
  );
}
