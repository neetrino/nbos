import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAccountAccessRole, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { mailRoleCanManageAccess } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import {
  formatEmployeeName,
  listMailAccountAccessEntries,
  removeMailAccountAccess,
  updateMailAccountAccessRole,
  upsertMailAccountAccess,
} from './mail-account-access.ops';
import { MAIL_AUDIT_ENTITY_MAIL_ACCOUNT } from './mail-audit.constants';
import type { MailAccountAccessListDto } from './mail.types';

@Injectable()
export class MailAccountAccessService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  private async requireManage(employeeId: string, viewScope: string, mailAccountId: string) {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    if (!mailRoleCanManageAccess(loaded.role)) {
      throw new ForbiddenException('You cannot manage access for this mailbox');
    }
    return loaded;
  }

  async listAccess(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
  ): Promise<MailAccountAccessListDto> {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    const entries = await listMailAccountAccessEntries(this.prisma, mailAccountId);
    const ownerId = loaded.account.ownerEmployeeId;
    const owner = ownerId
      ? await this.prisma.employee.findUnique({
          where: { id: ownerId },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : null;
    return {
      mailAccountId,
      viewerRole: loaded.role,
      owner: owner
        ? {
            employeeId: owner.id,
            employeeName: formatEmployeeName(owner.firstName, owner.lastName),
            employeeEmail: owner.email,
          }
        : null,
      entries,
    };
  }

  async grantAccess(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
    targetEmployeeId: string,
    role: MailAccountAccessRole,
  ): Promise<MailAccountAccessListDto> {
    const loaded = await this.requireManage(employeeId, viewScope, mailAccountId);
    if (loaded.account.ownerEmployeeId === targetEmployeeId) {
      throw new BadRequestException('The mailbox owner already has full access');
    }
    const target = await this.prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Target employee not found');
    }
    await upsertMailAccountAccess(this.prisma, {
      mailAccountId,
      employeeId: targetEmployeeId,
      role,
      grantedByEmployeeId: employeeId,
    });
    await this.logAccessChange(employeeId, mailAccountId, 'mail.access_granted', {
      targetEmployeeId,
      role,
    });
    return this.listAccess(employeeId, viewScope, mailAccountId);
  }

  async updateRole(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
    targetEmployeeId: string,
    role: MailAccountAccessRole,
  ): Promise<MailAccountAccessListDto> {
    const loaded = await this.requireManage(employeeId, viewScope, mailAccountId);
    if (loaded.account.ownerEmployeeId === targetEmployeeId) {
      throw new BadRequestException('The mailbox owner role cannot be changed');
    }
    const updated = await updateMailAccountAccessRole(this.prisma, {
      mailAccountId,
      targetEmployeeId,
      role,
    });
    if (!updated) {
      throw new NotFoundException('Access entry not found');
    }
    await this.logAccessChange(employeeId, mailAccountId, 'mail.access_role_changed', {
      targetEmployeeId,
      role,
    });
    return this.listAccess(employeeId, viewScope, mailAccountId);
  }

  async removeAccess(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
    targetEmployeeId: string,
  ): Promise<MailAccountAccessListDto> {
    const loaded = await this.requireManage(employeeId, viewScope, mailAccountId);
    if (loaded.account.ownerEmployeeId === targetEmployeeId) {
      throw new BadRequestException('The mailbox owner cannot lose owner access');
    }
    const removed = await removeMailAccountAccess(this.prisma, {
      mailAccountId,
      targetEmployeeId,
    });
    if (!removed) {
      throw new NotFoundException('Access entry not found');
    }
    await this.logAccessChange(employeeId, mailAccountId, 'mail.access_revoked', {
      targetEmployeeId,
    });
    return this.listAccess(employeeId, viewScope, mailAccountId);
  }

  private async logAccessChange(
    employeeId: string,
    mailAccountId: string,
    action: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
      entityId: mailAccountId,
      action,
      userId: employeeId,
      changes,
    });
  }
}
