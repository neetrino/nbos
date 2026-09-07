'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { WhatsAppGatewayDirectoryPicker } from './WhatsAppGatewayDirectoryPicker';

interface WhatsAppGatewayDirectorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configured: boolean;
}

export function WhatsAppGatewayDirectorySheet({
  open,
  onOpenChange,
  configured,
}: WhatsAppGatewayDirectorySheetProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-x-hidden sm:max-w-md">
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <SheetHeader className="border-border shrink-0 border-b px-5 py-4 pr-14">
            <SheetTitle>WhatsApp chats</SheetTitle>
            <SheetDescription>
              Groups and personal chats in one inbox-style list. Search is sent to the Gateway on
              every request.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-5 py-4">
            <WhatsAppGatewayDirectoryPicker
              open={open}
              configured={configured}
              search={search}
              onSearchChange={setSearch}
              debouncedSearch={debouncedSearch}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
