'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { getEmployeeStatus } from '@/features/hr/constants/hr';

interface TeamMemberEmployeeStatusBadgeProps {
  status: string | null | undefined;
  /** Show status indicator dot (About project team cards). */
  dot?: boolean;
  className?: string;
}

export function TeamMemberEmployeeStatusBadge({
  status,
  dot = false,
  className,
}: TeamMemberEmployeeStatusBadgeProps) {
  const info = status ? getEmployeeStatus(status) : undefined;
  if (!info) return null;

  return <StatusBadge label={info.label} variant={info.variant} dot={dot} className={className} />;
}
