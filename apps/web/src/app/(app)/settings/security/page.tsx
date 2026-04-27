'use client';

import { ShieldCheck } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function SecurityPage() {
  return (
    <ModulePlaceholder
      title="Security"
      description="Global security defaults for sessions, 2FA requirements, password policy, and vault access."
      emptyTitle="Security defaults are not configured yet"
      emptyDescription="Security settings will be implemented with explicit validation and audit instead of loose form fields."
      icon={ShieldCheck}
    />
  );
}
