'use client';

import { useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { metaIntegrationApi } from '@/lib/api/meta-integration';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface MetaConnectSheetProps {
  onClose: () => void;
}

const PROVIDER_TILE_CLASS =
  'border-border bg-card hover:bg-muted/60 focus-visible:ring-ring flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

export function MetaConnectSheet({ onClose }: MetaConnectSheetProps) {
  const [loading, setLoading] = useState(false);

  const startConnect = async () => {
    setLoading(true);
    try {
      const { url } = await metaIntegrationApi.startOAuth();
      window.location.href = url;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not start Meta connection.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="border-border shrink-0 border-b px-5 py-4">
        <SheetTitle>Connect Meta</SheetTitle>
        <SheetDescription>
          Authorize NBOS to receive Instagram Direct and Facebook Messenger messages. Connected
          pages appear in Integrations; link each to a Marketing account (SMM) before Leads are
          created.
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void startConnect()}
            disabled={loading}
            className={PROVIDER_TILE_CLASS}
          >
            <Instagram size={20} className="text-foreground" aria-hidden />
            <span className="text-foreground font-medium">Instagram</span>
            <span className="text-muted-foreground text-xs">
              Connect Instagram Professional accounts linked to your Facebook Pages.
            </span>
          </button>
          <button
            type="button"
            onClick={() => void startConnect()}
            disabled={loading}
            className={PROVIDER_TILE_CLASS}
          >
            <Facebook size={20} className="text-foreground" aria-hidden />
            <span className="text-foreground font-medium">Facebook</span>
            <span className="text-muted-foreground text-xs">
              Connect Facebook Pages for Messenger inbound messages.
            </span>
          </button>
        </div>

        <p className="text-muted-foreground text-xs">
          One Meta authorization covers all Pages and linked Instagram accounts you select in
          Facebook.
        </p>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
