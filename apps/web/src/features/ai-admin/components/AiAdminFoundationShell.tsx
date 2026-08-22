import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function AiAdminFoundationShell(props: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return <EmptyState icon={props.icon} title={props.title} description={props.description} />;
}
