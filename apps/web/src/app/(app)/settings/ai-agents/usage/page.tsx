'use client';

import { Sparkles } from 'lucide-react';
import { AiAdminFoundationShell } from '@/features/ai-admin/components/AiAdminFoundationShell';

export default function AiUsagePage() {
  return (
    <AiAdminFoundationShell
      icon={Sparkles}
      title="Usage is a foundation shell"
      description="Token, cost, and evaluation dashboards ship with the usage/evaluation slice. This page does not invent counters."
    />
  );
}
