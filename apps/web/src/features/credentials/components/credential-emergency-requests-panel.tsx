'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { credentialsApi } from '@/lib/api/credentials';
import { usePermission } from '@/lib/permissions';
import { toast } from 'sonner';

const EMERGENCY_REQUESTS_QUERY_KEY = ['credentials', 'emergency-requests'] as const;

type EmergencyDecision = 'approve' | 'deny';
type EmergencyRequestItem = Awaited<
  ReturnType<typeof credentialsApi.listEmergencyAccessRequests>
>['items'][number];

export function CredentialEmergencyRequestsPanel() {
  const { me } = usePermission();
  const queryClient = useQueryClient();
  const isOwner = me?.isPlatformOwner === true;
  const [pending, setPending] = useState<{ id: string; decision: EmergencyDecision } | null>(null);

  const { data } = useQuery({
    queryKey: EMERGENCY_REQUESTS_QUERY_KEY,
    queryFn: () => credentialsApi.listEmergencyAccessRequests(),
    enabled: isOwner,
  });

  const items = data?.items ?? [];
  if (!isOwner || items.length === 0) return null;

  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <h3 className="text-sm font-medium">Emergency access requests</h3>
      <ul className="mt-3 grid gap-3">
        {items.map((item) => (
          <EmergencyRequestRow key={item.id} item={item} onDecide={setPending} />
        ))}
      </ul>
      <CredentialStepUpDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending?.decision === 'deny' ? 'Deny emergency request' : 'Approve emergency access'}
        onConfirm={(stepUpPassword) =>
          submitEmergencyDecision(pending, stepUpPassword, queryClient)
        }
      />
    </div>
  );
}

function EmergencyRequestRow({
  item,
  onDecide,
}: {
  item: EmergencyRequestItem;
  onDecide: (pending: { id: string; decision: EmergencyDecision }) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm">
          {item.requester.firstName} {item.requester.lastName} →{' '}
          {item.credential.name ?? item.credential.id}
        </p>
        <p className="text-muted-foreground text-xs">{item.reason}</p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onDecide({ id: item.id, decision: 'approve' })}
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onDecide({ id: item.id, decision: 'deny' })}
        >
          Deny
        </Button>
      </div>
    </li>
  );
}

async function submitEmergencyDecision(
  pending: { id: string; decision: EmergencyDecision } | null,
  stepUpPassword: string,
  queryClient: QueryClient,
): Promise<void> {
  if (!pending) return;
  try {
    await credentialsApi.decideEmergencyAccess(pending.id, pending.decision, stepUpPassword);
    toast.success(pending.decision === 'approve' ? 'Emergency access approved' : 'Request denied');
    await queryClient.invalidateQueries({ queryKey: EMERGENCY_REQUESTS_QUERY_KEY });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Decision failed');
    throw err;
  }
}
