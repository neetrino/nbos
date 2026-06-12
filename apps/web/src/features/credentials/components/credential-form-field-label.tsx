'use client';

import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function CredentialFormFieldLabel({
  htmlFor,
  label,
  icon: Icon,
}: {
  htmlFor?: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Label htmlFor={htmlFor} className="inline-flex items-center gap-1.5">
      <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      {label}
    </Label>
  );
}
