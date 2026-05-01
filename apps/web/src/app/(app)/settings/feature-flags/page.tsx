'use client';

import { ToggleLeft } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function FeatureFlagsPage() {
  return (
    <ModulePlaceholder
      title="Feature Flags"
      description="Controlled feature availability by module, environment, role, and future rollout targets."
      emptyTitle="Feature flags are not configured yet"
      emptyDescription="Feature flags will be separate from RBAC and will include audit for risky enable or disable actions."
      icon={ToggleLeft}
    />
  );
}
