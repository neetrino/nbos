import type { StatusVariant } from '@/components/shared';
import type {
  TechnicalAssetStatus,
  TechnicalBackupStatus,
  TechnicalDeployStatus,
  TechnicalHealthStatus,
} from '@/lib/api/technical';

export function formatTechnicalEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function technicalHealthVariant(status: TechnicalHealthStatus): StatusVariant {
  switch (status) {
    case 'HEALTHY':
      return 'green';
    case 'WARNING':
      return 'amber';
    case 'CRITICAL':
      return 'red';
    case 'NOT_CONFIGURED':
      return 'gray';
    default:
      return 'default';
  }
}

export function technicalBackupVariant(status: TechnicalBackupStatus): StatusVariant {
  switch (status) {
    case 'HEALTHY':
      return 'green';
    case 'WARNING':
      return 'amber';
    case 'MISSING':
      return 'red';
    case 'NOT_REQUIRED':
      return 'gray';
    default:
      return 'default';
  }
}

export function technicalAssetStatusVariant(status: TechnicalAssetStatus): StatusVariant {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'WARNING':
      return 'amber';
    case 'BROKEN':
      return 'red';
    case 'DEPRECATED':
      return 'gray';
    default:
      return 'default';
  }
}

export function technicalDeployStatusVariant(status: TechnicalDeployStatus): StatusVariant {
  switch (status) {
    case 'SUCCESS':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'ROLLED_BACK':
      return 'amber';
    default:
      return 'gray';
  }
}
