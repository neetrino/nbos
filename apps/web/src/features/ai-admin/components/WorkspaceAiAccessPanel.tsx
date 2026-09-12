'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BotMessageSquare, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, LoadingState } from '@/components/shared';
import { aiAdminApi, type ExternalAgentBundle, type WorkspaceAccessRow } from '@/lib/api/ai-admin';
import { AI_ADMIN_BASE_PATH } from '../constants';
import { grantableExternalAgents } from '../grantable-agents';
import { applySelectValue } from '../select-value';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminEntityRow } from './AiAdminEntityRow';
import { AiAdminPageToolbar } from './AiAdminPageToolbar';

export function WorkspaceAiAccessPanel({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations('workSpaces');
  const [rows, setRows] = useState<WorkspaceAccessRow[]>([]);
  const [agents, setAgents] = useState<ExternalAgentBundle[]>([]);
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextRows, nextAgents] = await Promise.all([
        aiAdminApi.listWorkspaceAccess(workspaceId),
        aiAdminApi.listExternalAgents(),
      ]);
      setRows(nextRows);
      setAgents(nextAgents);
      setError(null);
    } catch {
      setError(t('aiAccess.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState count={2} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const grantedIds = new Set(
    rows.map((row) => row.agent?.id).filter((id): id is string => Boolean(id)),
  );
  const available = grantableExternalAgents(agents, grantedIds);

  return (
    <section className="space-y-3">
      <AiAdminPageToolbar
        icon={BotMessageSquare}
        description={t('aiAccess.description')}
      />
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('aiAccess.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.scope.id}>
              <AiAdminEntityRow
                icon={BotMessageSquare}
                title={row.agent?.name ?? t('aiAccess.unknownAgent')}
                description={
                  row.capabilities.map((item) => item.capabilityKey).join(', ') ||
                  t('aiAccess.noCapabilities')
                }
                statusLabel={row.agent?.state}
                statusVariant={row.agent ? agentStateVariant(row.agent.state) : undefined}
                pills={[
                  {
                    icon: KeyRound,
                    text: t('aiAccess.capabilities', { count: row.capabilities.length }),
                  },
                ]}
                footer={
                  <div className="flex flex-wrap gap-2">
                    {row.agent ? (
                      <Link
                        href={`${AI_ADMIN_BASE_PATH}/external-agents/${row.agent.id}`}
                        className="text-xs underline"
                      >
                        {t('aiAccess.openDetail')}
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void aiAdminApi
                          .revokeWorkspaceAccess(workspaceId, row.scope.id)
                          .then(load)
                          .catch(() => toast.error(t('aiAccess.revokeFailed')))
                      }
                    >
                      {t('aiAccess.revoke')}
                    </Button>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Select value={agentId} onValueChange={(value) => applySelectValue(value, setAgentId)}>
          <SelectTrigger size="sm" className="min-w-[12rem]">
            <SelectValue placeholder={t('aiAccess.agentPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {available.map((bundle) => (
              <SelectItem key={bundle.agent.id} value={bundle.agent.id}>
                {bundle.agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={!agentId}
          onClick={() =>
            void aiAdminApi
              .grantWorkspaceAccess(workspaceId, agentId)
              .then(() => {
                setAgentId('');
                return load();
              })
              .catch(() => toast.error(t('aiAccess.grantFailed')))
          }
        >
          {t('aiAccess.grant')}
        </Button>
      </div>
    </section>
  );
}
