'use client';

import { useParams } from 'next/navigation';
import { InternalAgentDetailPanel } from '@/features/ai-admin/components/InternalAgentDetailPanel';

export default function InternalAgentDetailPage() {
  const params = useParams<{ id: string }>();
  return <InternalAgentDetailPanel agentId={params.id} />;
}
