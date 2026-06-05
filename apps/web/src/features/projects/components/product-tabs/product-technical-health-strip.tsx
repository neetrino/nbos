'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Headphones, Shield, Activity } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { TechnicalProductProfileResponse } from '@/lib/api/technical';
import {
  formatTechnicalEnum,
  technicalBackupVariant,
  technicalHealthVariant,
} from '@/features/projects/utils/product-technical-status';
import { cn } from '@/lib/utils';

interface ProductTechnicalHealthStripProps {
  data: TechnicalProductProfileResponse;
}

export function ProductTechnicalHealthStrip({ data }: ProductTechnicalHealthStripProps) {
  const ready = data.readiness.isReadyForTransfer;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <HealthMetric
        icon={ready ? CheckCircle2 : AlertTriangle}
        iconClass={ready ? 'text-green-600' : 'text-amber-600'}
        label="Readiness"
        value={ready ? 'Ready for transfer' : `${data.readiness.blockers.length} blockers`}
      />
      <HealthMetric
        icon={Activity}
        iconClass="text-blue-500"
        label="Monitoring"
        value={
          <StatusBadge
            label={formatTechnicalEnum(data.monitoringBaseline.monitoringStatus)}
            variant={technicalHealthVariant(data.monitoringBaseline.monitoringStatus)}
          />
        }
      />
      <HealthMetric
        icon={Shield}
        iconClass="text-violet-500"
        label="Backup"
        value={
          <StatusBadge
            label={formatTechnicalEnum(data.monitoringBaseline.backupStatus)}
            variant={technicalBackupVariant(data.monitoringBaseline.backupStatus)}
          />
        }
      />
      <HealthMetric
        icon={Headphones}
        iconClass="text-orange-500"
        label="Incidents"
        value={
          <span className="inline-flex items-center gap-1.5">
            <span className="font-semibold tabular-nums">{data.support.openIncidentCount}</span>
            {data.support.criticalIncidentCount > 0 ? (
              <span className="text-muted-foreground text-xs">
                ({data.support.criticalIncidentCount} critical)
              </span>
            ) : null}
            <Link
              href="/support"
              className="text-primary text-xs underline-offset-2 hover:underline"
            >
              Support
            </Link>
          </span>
        }
      />
    </div>
  );
}

function HealthMetric({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof Activity;
  iconClass: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="bg-card border-border rounded-xl border px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={cn('shrink-0', iconClass)} aria-hidden />
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
