'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PermissionGate } from '@/lib/permissions/PermissionGate';
import { getApiErrorMessage } from '@/lib/api-errors';
import { whatsappGatewayApi, type WhatsAppGatewayConnectionView } from '@/lib/api/whatsapp';

export function WhatsAppGatewayIntegrationsCard() {
  const [view, setView] = useState<WhatsAppGatewayConnectionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saving, setSaving] = useState(false);

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
    try {
      const next = await whatsappGatewayApi.test();
      setView(next);
      toast.success('WhatsApp Gateway connection OK.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'WhatsApp Gateway test failed.'));
      void load();
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect WhatsApp Gateway and clear the stored token?')) return;
    try {
      const next = await whatsappGatewayApi.disconnect();
      setView(next);
      toast.success('WhatsApp Gateway disconnected.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not disconnect WhatsApp Gateway.'));
    }
  }

  return (
    <PermissionGate module="COMPANY" action="EDIT">
      <div className="border-border rounded-xl border p-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted rounded-lg p-2">
            <MessageCircle className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold">WhatsApp Gateway</h3>
            <p className="text-muted-foreground text-sm">
              {loading
                ? 'Loading…'
                : view?.configured
                  ? `Configured · ${view.status}`
                  : 'Not configured'}
            </p>
            {view?.baseUrl ? (
              <p className="text-muted-foreground truncate text-xs">{view.baseUrl}</p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Token: {view?.hasToken ? '•••••••• (stored encrypted)' : 'not set'}
            </p>
            {view?.lastErrorMessage ? (
              <p className="text-destructive text-xs">{view.lastErrorMessage}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setSheetOpen(true)}>
            {view?.configured ? 'Update' : 'Connect'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!view?.configured}
            onClick={() => void test()}
          >
            Test connection
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!view?.configured}
            onClick={() => void disconnect()}
          >
            Disconnect
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>WhatsApp Gateway</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="wa-gateway-url">
                Gateway URL
              </label>
              <Input
                id="wa-gateway-url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://wa-gateway.example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="wa-gateway-token">
                API token {view?.hasToken ? '(leave blank to keep current)' : ''}
              </label>
              <Input
                id="wa-gateway-token"
                type="password"
                value={apiToken}
                onChange={(event) => setApiToken(event.target.value)}
                placeholder="gw_live_…"
                autoComplete="off"
              />
            </div>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </PermissionGate>
  );
}
