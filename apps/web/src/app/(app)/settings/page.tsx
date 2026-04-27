'use client';

import Link from 'next/link';
import {
  Cable,
  ClipboardList,
  ListChecks,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/shared';

const SETTINGS_SECTIONS = [
  {
    title: 'System Lists',
    href: '/settings/lists',
    description: 'Safe system-owned labels and display order.',
    icon: ListChecks,
  },
  {
    title: 'Permissions / RBAC',
    href: '/settings/roles',
    description: 'Technical permission roles and access scopes.',
    icon: ShieldCheck,
  },
  {
    title: 'Module Settings',
    href: '/settings/module-settings',
    description: 'Safe module defaults, not business-rule builders.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    description: 'Provider registry, status, and secret references.',
    icon: Cable,
  },
  {
    title: 'Security',
    href: '/settings/security',
    description: 'Session, 2FA, password, and vault defaults.',
    icon: ShieldCheck,
  },
  {
    title: 'Feature Flags',
    href: '/settings/feature-flags',
    description: 'Controlled feature availability by environment and role.',
    icon: ToggleLeft,
  },
  {
    title: 'Audit Log',
    href: '/settings/audit-log',
    description: 'Read-only trail for risky admin changes.',
    icon: ClipboardList,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings / Admin"
        description="System administration for platform configuration, technical permissions, integrations, security, feature flags, and audit."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="border-border bg-card hover:bg-muted/40 rounded-2xl border p-5 transition-colors"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-secondary text-muted-foreground flex size-10 items-center justify-center rounded-xl">
                  <Icon size={18} />
                </div>
                <h2 className="text-foreground text-base font-semibold">{section.title}</h2>
              </div>
              <p className="text-muted-foreground text-sm">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
