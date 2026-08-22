'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cable, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApi, type AiProviderConnectionView } from '@/lib/api/ai-admin';
import { formatTimestamp } from '../format';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';
import { DisableImpactConfirm } from './DisableImpactConfirm';
import { ProviderConnectDialog } from './ProviderConnectDialog';

export function ProviderListPanel() {
  const [rows, setRows] = useState<AiProviderConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: 'disable' | 'revoke' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await aiAdminApi.listProviders());
      setError(null);
    } catch {
      setError('Provider connections could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: 'validate' | 'disable' | 'enable' | 'revoke') => {
    setBusyId(id);
    try {
      if (action === 'validate') {
        const result = await aiAdminApi.validateProvider(id);
        toast[result.result.ok ? 'success' : 'error'](
          result.result.ok
            ? 'Connection validated'
            : (result.result.errorCode ?? 'Validation failed'),
        );
      }
      if (action === 'disable') await aiAdminApi.disableProvider(id);
      if (action === 'enable') await aiAdminApi.enableProvider(id);
      if (action === 'revoke') await aiAdminApi.revokeProvider(id);
      await load();
    } catch {
      toast.error('Provider action failed.');
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Internal AI provider connections. These are not External Agent credentials.
      </p>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setConnectOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Connect provider
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Cable}
          title="No provider connections"
          description="Connect OpenAI or Anthropic. The API key is stored encrypted and never shown again."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ProviderRow
              key={row.id}
              row={row}
              busy={busyId === row.id}
              onValidate={() => void runAction(row.id, 'validate')}
              onEnable={() => void runAction(row.id, 'enable')}
              onDisable={() => setConfirm({ id: row.id, action: 'disable' })}
              onRevoke={() => setConfirm({ id: row.id, action: 'revoke' })}
              onRotate={load}
            />
          ))}
        </div>
      )}
      <ProviderConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onCreated={() => void load()}
      />
      <DisableImpactConfirm
        open={confirm?.action === 'disable'}
        kind="provider"
        targetId={confirm?.action === 'disable' ? confirm.id : null}
        title="Disable provider?"
        confirmLabel="Disable"
        isSubmitting={busyId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) void runAction(confirm.id, confirm.action);
        }}
      />
      <AiAdminConfirmDialog
        open={confirm?.action === 'revoke'}
        title="Revoke provider connection?"
        description="The stored key is deleted. Models on this connection stop being usable."
        confirmLabel="Revoke"
        destructive
        isSubmitting={busyId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) void runAction(confirm.id, confirm.action);
        }}
      />
    </div>
  );
}

function ProviderRow(props: {
  row: AiProviderConnectionView;
  busy: boolean;
  onValidate: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onRevoke: () => void;
  onRotate: () => void;
}) {
  const { row } = props;
  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{row.name}</h2>
          <p className="text-muted-foreground font-mono text-xs">
            {row.provider} · {row.keyPrefix}
          </p>
        </div>
        <StatusBadge label={row.status} variant={agentStateVariant(row.status)} />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Validated {formatTimestamp(row.lastValidatedAt)} · Synced{' '}
        {formatTimestamp(row.lastModelSyncAt)}
      </p>
      {row.status !== 'REVOKED' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {row.status === 'ACTIVE' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={props.busy}
              onClick={props.onValidate}
            >
              Validate
            </Button>
          ) : null}
          <ProviderRotateButton
            connectionId={row.id}
            provider={row.provider}
            baseUrl={row.baseUrl}
            disabled={props.busy}
            onRotated={props.onRotate}
          />
          {row.status === 'ACTIVE' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={props.busy}
              onClick={props.onDisable}
            >
              Disable
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={props.busy}
              onClick={props.onEnable}
            >
              Enable
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={props.busy}
            onClick={props.onRevoke}
          >
            Revoke
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
          Revoked connections cannot be re-enabled.
        </p>
      )}
    </section>
  );
}

function ProviderRotateButton(props: {
  connectionId: string;
  provider: AiProviderConnectionView['provider'];
  baseUrl: string | null;
  disabled: boolean;
  onRotated: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={props.disabled}
        onClick={() => setOpen(true)}
      >
        Rotate key
      </Button>
      <ProviderConnectDialog
        open={open}
        onOpenChange={setOpen}
        mode="rotate"
        connectionId={props.connectionId}
        connectionProvider={props.provider}
        connectionBaseUrl={props.baseUrl}
        onCreated={props.onRotated}
      />
    </>
  );
}
