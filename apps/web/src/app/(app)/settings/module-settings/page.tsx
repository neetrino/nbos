'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';
import { notificationsApi, type NotificationAdminRuleDto } from '@/lib/api/notifications';

const RULE_CHANNELS = ['IN_APP', 'EMAIL', 'TELEGRAM', 'WHATSAPP'] as const;
const RULE_PRIORITIES = ['critical', 'high', 'normal', 'low'] as const;

export default function ModuleSettingsPage() {
  const [rules, setRules] = useState<NotificationAdminRuleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRules(await notificationsApi.listAdminRules());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function patchRule(
    code: string,
    patch: { enabled?: boolean; priority?: string; channels?: string[] },
  ) {
    const updated = await notificationsApi.patchAdminRule(code, patch);
    setRules((prev) => prev.map((row) => (row.code === code ? updated : row)));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Module Settings"
          description="Safe platform-level defaults and notification rules."
        />
        <p className="text-muted-foreground text-sm">Loading module settings…</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="Module settings are not configured yet"
        description="No admin-managed notification rules found."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Settings"
        description="Admin-managed notification rules: enablement, priority, and channel matrix."
      />

      <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Notification Rules</h2>
        {rules.map((rule) => (
          <div
            key={rule.code}
            className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
          >
            <div>
              <p className="text-foreground text-sm font-medium">{rule.eventType}</p>
              <p className="text-muted-foreground text-xs">{rule.code}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void patchRule(rule.code, { enabled: !rule.enabled })}
                className={`rounded-full px-3 py-1 text-xs ${
                  rule.enabled
                    ? 'bg-emerald-600/15 text-emerald-700'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </button>
              <select
                value={rule.priority}
                onChange={(e) => void patchRule(rule.code, { priority: e.target.value })}
                className="border-border bg-background rounded-md border px-2 py-1 text-xs"
              >
                {RULE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {RULE_CHANNELS.map((channel) => {
                const on = rule.channels.includes(channel);
                const next = on
                  ? rule.channels.filter((c) => c !== channel)
                  : [...rule.channels, channel];
                const normalized = next.length ? next : ['IN_APP'];
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => void patchRule(rule.code, { channels: normalized })}
                    className={`rounded-full px-3 py-1 text-xs ${
                      on ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
