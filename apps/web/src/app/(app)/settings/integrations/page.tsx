'use client';

import { Cable } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function IntegrationsPage() {
  return (
    <ModulePlaceholder
      title="Integrations"
      description="External provider registry, health status, reconnect actions, and secret references."
      emptyTitle="Integration registry is not configured yet"
      emptyDescription="Secrets will not be stored or shown here. This section will link to secure credential references when implemented."
      icon={Cable}
    />
  );
}
