'use client';

import { ShieldCheck } from 'lucide-react';
import { AiAdminFoundationShell } from '@/features/ai-admin/components/AiAdminFoundationShell';

export default function AiApprovalsPage() {
  return (
    <AiAdminFoundationShell
      icon={ShieldCheck}
      title="Approval queue is not enabled yet"
      description="Pending approvals will appear here when the approval runtime ships. D 91 remains open."
    />
  );
}
