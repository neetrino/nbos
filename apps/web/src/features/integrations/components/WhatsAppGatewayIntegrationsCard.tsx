'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PermissionGate } from '@/lib/permissions/PermissionGate';
import { getApiErrorMessage } from '@/lib/api-errors';
import { whatsappGatewayApi, type WhatsAppGatewayConnectionView } from '@/lib/api/whatsapp';

const GATEWAY_DESCRIPTION = 'WhatsApp Web via Gateway → product groups & messaging';

export function WhatsAppGatewayIntegrationsCard() {
  const [view, setView] = useState<WhatsAppGatewayConnectionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await whatsappGatewayApi.getConnection();
      setView(next);
      setBaseUrl(next.baseUrl ?? '');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load WhatsApp Gateway settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      const next = await whatsappGatewayApi.upsert({
        baseUrl: baseUrl.trim() || undefined,
        apiToken: apiToken.trim() || undefined,
      });
      setView(next);
      setApiToken('');
      toast.success('WhatsApp Gateway saved.');
      setSheetOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save WhatsApp Gateway.'));
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const next = await whatsappGatewayApi.test();
      setView(next);
      toast.success('WhatsApp Gateway connection OK.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'WhatsApp Gateway test failed.'));
      void load();
    } finally {
      setTesting(false);
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect WhatsApp Gateway and clear the stored token?')) return;
    try {
      const next = await whatsappGatewayApi.disconnect();
      setView(next);
      setBaseUrl('');
      setApiToken('');
      toast.success('WhatsApp Gateway disconnected.');
      setSheetOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not disconnect WhatsApp Gateway.'));
    }
  }

  const description = loading
    ? 'Loading…'
    : view?.configured
      ? `Configured · ${view.status}`
      : GATEWAY_DESCRIPTION;

  return (
    <PermissionGate module="COMPANY" action="EDIT">
      <div className="min-w-0">
        <section className="border-border bg-card rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <MessageCircle size={20} className="text-foreground mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">WhatsApp Gateway</h3>
              <p className="text-muted-foreground mt-1 text-xs">{description}</p>
              {view?.lastErrorMessage ? (
                <p className="text-destructive mt-1 truncate text-xs">{view.lastErrorMessage}</p>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={loading}
                onClick={() => setSheetOpen(true)}
              >
                {view?.configured ? 'Manage' : 'Connect'}
              </Button>
            </div>
          </div>
        </section>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-x-hidden sm:max-w-md">
            <div className="flex h-full min-h-0 min-w-0 flex-col">
              <SheetHeader className="border-border shrink-0 border-b px-5 py-4 pr-14">
                <SheetTitle>WhatsApp Gateway</SheetTitle>
                <SheetDescription>
                  Connect NBOS to the WhatsApp Gateway (HTTPS URL + API token). Product groups and
                  messaging go through Gateway → WAHA.
                </SheetDescription>
              </SheetHeader>

              <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <p className="text-muted-foreground text-sm">
                  Status: {view?.configured ? view.status : 'Not configured'}
                  {view?.hasToken ? ' · token stored' : ''}
                </p>
                {view?.baseUrl ? (
                  <p className="text-muted-foreground text-xs break-all">{view.baseUrl}</p>
                ) : null}
                {view?.lastErrorMessage ? (
                  <p className="text-destructive text-xs break-words">{view.lastErrorMessage}</p>
                ) : null}
                <div className="min-w-0 space-y-2">
                  <label className="text-sm font-medium" htmlFor="wa-gateway-url">
                    Gateway URL
                  </label>
                  <Input
                    id="wa-gateway-url"
                    className="w-full min-w-0"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder="https://wa-gateway.example.com"
                    inputMode="url"
                    autoComplete="url"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <label className="text-sm font-medium" htmlFor="wa-gateway-token">
                    API token {view?.hasToken ? '(leave blank to keep current)' : ''}
                  </label>
                  <Input
                    id="wa-gateway-token"
                    className="w-full min-w-0"
                    type="password"
                    value={apiToken}
                    onChange={(event) => setApiToken(event.target.value)}
                    placeholder="gw_live_…"
                    autoComplete="off"
                  />
                </div>
              </div>

              <SheetFooter className="border-border shrink-0 flex-row flex-wrap gap-2 border-t px-5 py-4 sm:justify-start">
                <Button type="button" disabled={saving} onClick={() => void save()}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!view?.configured || testing}
                  onClick={() => void test()}
                >
                  Test connection
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!view?.configured}
                  onClick={() => void disconnect()}
                >
                  Disconnect
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PermissionGate>
  );
}
