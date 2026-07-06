'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { getEmployeeStatus } from '@/features/hr/constants/hr';

interface TeamMemberEmployeeStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function TeamMemberEmployeeStatusBadge({
  status,
  className,
}: TeamMemberEmployeeStatusBadgeProps) {
  const info = status ? getEmployeeStatus(status) : undefined;
  if (!info) return null;

  return <StatusBadge label={info.label} variant={info.variant} className={className} />;
}
