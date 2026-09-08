import type { DeleteConfirmLevel } from '@/components/shared';

export function rolePermissionSaveConfirmLevel(isSystem: boolean): DeleteConfirmLevel {
  return isSystem ? 'strong' : 'simple';
}

export function rolePermissionSaveConfirmCopy(isSystem: boolean): {
  title: string;
  description: string;
} {
  if (isSystem) {
    return {
      title: 'Save system role permissions?',
      description:
        'This changes access for everyone with this role. Copy the role name, paste it below, then save.',
    };
  }
  return {
    title: 'Save role permissions?',
    description: 'This changes access for everyone with this role.',
  };
}
