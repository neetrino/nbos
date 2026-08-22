'use client';

import { useParams } from 'next/navigation';
import { ExternalAgentDetailPanel } from '@/features/ai-admin/components/ExternalAgentDetailPanel';

export default function ExternalAgentDetailPage() {
  const params = useParams<{ id: string }>();
  return <ExternalAgentDetailPanel agentId={params.id} />;
}
