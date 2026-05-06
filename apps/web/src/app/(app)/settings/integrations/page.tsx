'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cable, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { systemListsApi, type SystemListOption } from '@/lib/api/systemLists';

const PROVIDERS_KEY = 'INTEGRATION_PROVIDER';
const SETUP_KEY = 'INTEGRATION_REQUIRED_SETUP';
const STATUS_KEY = 'INTEGRATION_REGISTRY_STATUS';

const STATUS_OPTIONS = ['NOT_CONFIGURED', 'REQUIRES_SETUP', 'CONNECTED', 'DEGRADED'] as const;
type RegistryStatus = (typeof STATUS_OPTIONS)[number];

const DEFAULT_PROVIDERS = [
  ['GOOGLE_MAIL', 'Google Mail'],
  ['GOOGLE_CALENDAR', 'Google Calendar'],
  ['GOOGLE_DRIVE', 'Google Drive'],
  ['TELEGRAM', 'Telegram'],
  ['WHATSAPP', 'WhatsApp'],
  ['GITHUB', 'GitHub'],
  ['SENTRY', 'Sentry'],
] as const;

const DEFAULT_SETUP_ITEMS = [
  ['GOOGLE_MAIL__OAUTH_CLIENT_ID', 'OAuth client id'],
  ['GOOGLE_MAIL__OAUTH_CLIENT_SECRET', 'OAuth client secret'],
  ['GOOGLE_CALENDAR__OAUTH_SCOPES', 'Calendar OAuth scopes'],
  ['GOOGLE_DRIVE__SERVICE_ACCOUNT_OR_OAUTH', 'Drive auth method'],
  ['TELEGRAM__BOT_TOKEN', 'Bot token'],
  ['WHATSAPP__WAHA_INSTANCE', 'WAHA instance url'],
  ['GITHUB__WEBHOOK_SECRET', 'Webhook secret'],
  ['SENTRY__ORG_PROJECT_DSN', 'Project DSN'],
] as const;

function splitPrefixedCode(code: string): { providerCode: string; value: string } | null {
  const index = code.indexOf('__');
  if (index <= 0) return null;
  return { providerCode: code.slice(0, index), value: code.slice(index + 2) };
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<SystemListOption[]>([]);
  const [setupItems, setSetupItems] = useState<SystemListOption[]>([]);
  const [statusItems, setStatusItems] = useState<SystemListOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const groupedSetup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of setupItems.filter((row) => row.isActive)) {
      const parsed = splitPrefixedCode(item.code);
      if (!parsed) continue;
      const list = map.get(parsed.providerCode) ?? [];
      list.push(item.label);
      map.set(parsed.providerCode, list);
    }
    return map;
  }, [setupItems]);

  const activeStatusByProvider = useMemo(() => {
    const map = new Map<string, RegistryStatus>();
    for (const row of statusItems.filter((item) => item.isActive)) {
      const parsed = splitPrefixedCode(row.code);
      if (!parsed) continue;
      if (STATUS_OPTIONS.includes(parsed.value as RegistryStatus)) {
        map.set(parsed.providerCode, parsed.value as RegistryStatus);
      }
    }
    return map;
  }, [statusItems]);

  async function loadAll() {
    setLoading(true);
    try {
      const [providerRows, setupRows, statusRows] = await Promise.all([
        systemListsApi.getOptionsByKey(PROVIDERS_KEY, { includeInactive: true }),
        systemListsApi.getOptionsByKey(SETUP_KEY, { includeInactive: true }),
        systemListsApi.getOptionsByKey(STATUS_KEY, { includeInactive: true }),
      ]);
      setProviders(providerRows);
      setSetupItems(setupRows);
      setStatusItems(statusRows);
      setError(null);
    } catch {
      setError('Integration registry could not be loaded. Check your access and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function setProviderStatus(providerCode: string, nextStatus: RegistryStatus) {
    setSavingProvider(providerCode);
    try {
      const related = statusItems.filter((row) => row.code.startsWith(`${providerCode}__`));
      const activeOps = related
        .filter((row) => row.isActive)
        .map((row) => systemListsApi.update(row.id, { isActive: false }));
      if (activeOps.length) await Promise.all(activeOps);

      const targetCode = `${providerCode}__${nextStatus}`;
      const existing = related.find((row) => row.code === targetCode);
      if (existing) {
        await systemListsApi.update(existing.id, { label: nextStatus, isActive: true });
      } else {
        await systemListsApi.create({
          listKey: STATUS_KEY,
          code: targetCode,
          label: nextStatus,
          isActive: true,
        });
      }
      await loadAll();
    } finally {
      setSavingProvider(null);
    }
  }

  async function bootstrapDefaults() {
    setSavingProvider('__bootstrap__');
    try {
      const existingProviderCodes = new Set(providers.map((row) => row.code));
      for (const [code, label] of DEFAULT_PROVIDERS) {
        if (!existingProviderCodes.has(code)) {
          await systemListsApi.create({ listKey: PROVIDERS_KEY, code, label, isActive: true });
        }
      }

      const existingSetupCodes = new Set(setupItems.map((row) => row.code));
      for (const [code, label] of DEFAULT_SETUP_ITEMS) {
        if (!existingSetupCodes.has(code)) {
          await systemListsApi.create({ listKey: SETUP_KEY, code, label, isActive: true });
        }
      }

      const existingStatusCodes = new Set(statusItems.map((row) => row.code));
      for (const [providerCode] of DEFAULT_PROVIDERS) {
        const statusCode = `${providerCode}__NOT_CONFIGURED`;
        if (!existingStatusCodes.has(statusCode)) {
          await systemListsApi.create({
            listKey: STATUS_KEY,
            code: statusCode,
            label: 'NOT_CONFIGURED',
            isActive: true,
          });
        }
      }
      await loadAll();
    } finally {
      setSavingProvider(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Integrations"
          description="Provider registry, readiness statuses, and required setup lists."
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void loadAll()} />;
  }

  if (providers.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Integrations"
          description="Provider registry, readiness statuses, and required setup lists."
        />
        <EmptyState
          icon={Cable}
          title="Integration registry is empty"
          description="Bootstrap default providers and setup fields, then extend them via Settings → Lists."
          action={
            <Button
              onClick={() => void bootstrapDefaults()}
              disabled={savingProvider === '__bootstrap__'}
            >
              Bootstrap defaults
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Registry of providers with explicit setup checklist and current readiness status."
      >
        <Button size="sm" variant="outline" onClick={() => void loadAll()}>
          <RefreshCcw size={14} />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() => void bootstrapDefaults()}
          disabled={savingProvider === '__bootstrap__'}
        >
          Bootstrap defaults
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className="text-muted-foreground text-sm">
          Status and setup taxonomy is backed by system lists:
          <span className="font-mono"> {PROVIDERS_KEY}</span>,
          <span className="font-mono"> {SETUP_KEY}</span>,
          <span className="font-mono"> {STATUS_KEY}</span>.
        </p>
      </div>

      <div className="grid gap-4">
        {providers
          .filter((provider) => provider.isActive)
          .map((provider) => {
            const status = activeStatusByProvider.get(provider.code) ?? 'NOT_CONFIGURED';
            const setup = groupedSetup.get(provider.code) ?? [];
            return (
              <section
                key={provider.id}
                className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{provider.label}</h3>
                    <p className="text-muted-foreground font-mono text-xs">{provider.code}</p>
                  </div>
                  <select
                    className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-950"
                    value={status}
                    disabled={savingProvider === provider.code}
                    onChange={(event) =>
                      void setProviderStatus(provider.code, event.target.value as RegistryStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <p className="text-muted-foreground text-xs">Required setup</p>
                  {setup.length === 0 ? (
                    <p className="text-muted-foreground mt-1 text-sm">No setup items configured.</p>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {setup.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-stone-100 px-2 py-1 text-xs dark:bg-stone-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
