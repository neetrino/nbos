'use client';

import { ClipboardList } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function AuditLogPage() {
  return (
    <ModulePlaceholder
      title="Audit Log"
      description="Read-only trail for important admin, RBAC, security, integration, and system list changes."
      emptyTitle="Audit log is not configured yet"
      emptyDescription="NBOS will not fake audit history. Events will appear here only after the shared audit foundation is implemented."
      icon={ClipboardList}
    />
  );
}
