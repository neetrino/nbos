import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { SETTINGS_MODULE, SETTINGS_RBAC_MODULE, SETTINGS_SCHEDULER_MODULE } from '@nbos/shared';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../common/decorators/require-permission.decorator';
import { WhatsAppGatewayController } from './integrations/whatsapp-gateway/whatsapp-gateway.controller';
import { NotificationController } from './notifications/notification.controller';
import { AccessPoliciesController } from './platform-access/access-policies.controller';
import { PlatformAppearanceController } from './platform-appearance/platform-appearance.controller';
import { PlatformLifecycleController } from './platform-lifecycle/platform-lifecycle.controller';
import { PermissionsController } from './roles/permissions.controller';
import { RolesController } from './roles/roles.controller';
import { PlatformSchedulerJobsController } from './scheduler/platform-scheduler-jobs.controller';
import { SystemListsController } from './system-lists/system-lists.controller';

/**
 * Settings / Admin must never ride on `COMPANY`, which belongs to My Company.
 * Canon: docs/NBOS/02-Modules/16-Settings-Admin/02-Permissions-RBAC.md.
 */
function permissionOf(handler: unknown): RequiredPermission | undefined {
  return Reflect.getMetadata(PERMISSION_KEY, handler as object) as RequiredPermission | undefined;
}

describe('Settings / Admin permission wiring', () => {
  it('guards platform configuration with SETTINGS', () => {
    expect(permissionOf(PlatformAppearanceController.prototype.uploadWallpaper)).toEqual({
      module: SETTINGS_MODULE,
      action: 'EDIT',
    });
    expect(permissionOf(SystemListsController.prototype.getListKeys)).toEqual({
      module: SETTINGS_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(SystemListsController.prototype.create)).toEqual({
      module: SETTINGS_MODULE,
      action: 'EDIT',
    });
    expect(permissionOf(NotificationController.prototype.listAdminRules)).toEqual({
      module: SETTINGS_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(NotificationController.prototype.patchAdminRule)).toEqual({
      module: SETTINGS_MODULE,
      action: 'EDIT',
    });
  });

  it('requires SETTINGS.DELETE for the destructive retention purge', () => {
    expect(permissionOf(PlatformLifecycleController.prototype.getTrashInventory)).toEqual({
      module: SETTINGS_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(PlatformLifecycleController.prototype.runRetentionPurge)).toEqual({
      module: SETTINGS_MODULE,
      action: 'DELETE',
    });
  });

  it('guards the permission matrix and access levels with SETTINGS_RBAC', () => {
    expect(permissionOf(PermissionsController.prototype.findAll)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(RolesController.prototype.findById)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(RolesController.prototype.updatePermissions)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'EDIT',
    });
    expect(permissionOf(RolesController.prototype.remove)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'DELETE',
    });
    expect(permissionOf(AccessPoliciesController.prototype.listRolePolicies)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(AccessPoliciesController.prototype.upsertEmployeeOverride)).toEqual({
      module: SETTINGS_RBAC_MODULE,
      action: 'EDIT',
    });
  });

  it('guards scheduler job control with SETTINGS_SCHEDULER', () => {
    expect(permissionOf(PlatformSchedulerJobsController.prototype.listJobs)).toEqual({
      module: SETTINGS_SCHEDULER_MODULE,
      action: 'VIEW',
    });
    expect(permissionOf(PlatformSchedulerJobsController.prototype.patchJob)).toEqual({
      module: SETTINGS_SCHEDULER_MODULE,
      action: 'EDIT',
    });
    expect(permissionOf(PlatformSchedulerJobsController.prototype.runJobNow)).toEqual({
      module: SETTINGS_SCHEDULER_MODULE,
      action: 'EDIT',
    });
  });

  it('keeps the role list on COMPANY for My Company employee forms', () => {
    expect(permissionOf(RolesController.prototype.findAll)).toEqual({
      module: 'COMPANY',
      action: 'VIEW',
    });
  });

  // The unscoped Gateway directory is a Settings surface. Deal/product chat binding has its
  // own scoped `available-groups` endpoints, so widening these to CRM roles would leak the
  // company-wide chat list, including direct chats.
  it('keeps the whole WhatsApp gateway admin controller on SETTINGS', () => {
    for (const handler of [
      WhatsAppGatewayController.prototype.getConnection,
      WhatsAppGatewayController.prototype.upsert,
      WhatsAppGatewayController.prototype.test,
      WhatsAppGatewayController.prototype.disconnect,
      WhatsAppGatewayController.prototype.listChats,
      WhatsAppGatewayController.prototype.listGroups,
    ]) {
      expect(permissionOf(handler)).toEqual({ module: SETTINGS_MODULE, action: 'EDIT' });
    }
  });
});
