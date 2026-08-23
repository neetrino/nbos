'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { aiAdminApprovalsApi, type AiApprovalRequestView } from '@/lib/api/ai-admin-approvals';
import { agentStateVariant } from '../status-badge-map';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';

type QueueAction = 'approve' | 'reject';

export function ApprovalQueuePanel() {
  const [rows, setRows] = useState<AiApprovalRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; action: QueueAction } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await aiAdminApprovalsApi.listPending());
      setError(null);
    } catch {
      setError('Pending approvals could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        One-time approvals for AI actions. Secrets never appear here. Messenger auto-send is not
        enabled.
      </p>
      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending approvals"
          description="Risky AI actions will appear here until an employee approves or rejects them."
        />
      ) : (
        <ApprovalQueueList rows={rows} onDecide={setPending} />
      )}
      <AiAdminConfirmDialog
        open={pending !== null}
        title={pending?.action === 'reject' ? 'Reject this action?' : 'Approve this action?'}
        description="The actor, grant and payload digest are rechecked before an approved commit."
        confirmLabel={pending?.action === 'reject' ? 'Reject' : 'Approve'}
        destructive={pending?.action === 'reject'}
        isSubmitting={submitting}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        onConfirm={() => void confirmDecision(pending, setSubmitting, setPending, load)}
      />
    </div>
  );
}

function ApprovalQueueList(props: {
  rows: AiApprovalRequestView[];
  onDecide: (pending: { id: string; action: QueueAction }) => void;
}) {
  return (
    <div className="space-y-3">
      {props.rows.map((item) => (
        <ApprovalQueueRow
          key={item.id}
          item={item}
          onApprove={() => props.onDecide({ id: item.id, action: 'approve' })}
          onReject={() => props.onDecide({ id: item.id, action: 'reject' })}
        />
      ))}
    </div>
  );
}

function ApprovalQueueRow(props: {
  item: AiApprovalRequestView;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { item } = props;
  return (
    <article className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{item.capabilityKey}</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {item.requester.actorType} · {item.resource.resourceType}:{item.resource.resourceId}
          </p>
        </div>
        <StatusBadge label={item.riskClass} variant={agentStateVariant(item.riskClass)} />
      </div>
      <p className="text-muted-foreground mt-3 font-mono text-xs break-all">
        {item.safePayloadSummary}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Expires {new Date(item.expiresAt).toLocaleString()}
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={props.onApprove}>
          Approve
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onReject}>
          Reject
        </Button>
      </div>
    </article>
  );
}

async function confirmDecision(
  pending: { id: string; action: QueueAction } | null,
  setSubmitting: (value: boolean) => void,
  setPending: (value: { id: string; action: QueueAction } | null) => void,
  load: () => Promise<void>,
): Promise<void> {
  if (!pending) return;
  setSubmitting(true);
  try {
    if (pending.action === 'approve') {
      await aiAdminApprovalsApi.approve(pending.id);
    } else {
      await aiAdminApprovalsApi.reject(pending.id);
    }
    setPending(null);
    await load();
  } finally {
    setSubmitting(false);
  }
}
