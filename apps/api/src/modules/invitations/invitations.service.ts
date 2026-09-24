import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { DEFAULT_INTERFACE_LOCALE } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';
import { buildInvitationEmail } from './invitation-email';
import { createOpenInvitation, renewEmailInvitation } from './invitation-issue.ops';
import {
  OPEN_INVITE_ROLE_SLUG,
  buildAcceptInviteUrl,
  inviteExpiresAt,
  isOpenInviteEmail,
  normalizeInviteEmail,
} from './invitation-link';

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly ownership: PlatformOwnershipService,
  ) {}

  async create(data: {
    email: string;
    roleId: string;
    departmentId?: string;
    invitedById: string;
    invitedByRoleSlug: string;
  }) {
    await this.ownership.assertCanAssignRole({
      actorId: data.invitedById,
      actorRoleSlug: data.invitedByRoleSlug,
      targetEmployeeId: null,
      targetRoleId: data.roleId,
    });
    const email = normalizeInviteEmail(data.email);
    if (isOpenInviteEmail(email)) throw new BadRequestException('Email is required');
    const existingEmployee = await this.prisma.employee.findUnique({ where: { email } });
    if (existingEmployee?.passwordHash) {
      throw new ConflictException('Employee with this email already exists');
    }
    if (existingEmployee?.status === 'TERMINATED') {
      throw new BadRequestException('Account deactivated');
    }
    if (existingEmployee) {
      return this.issueAccessLink({
        employeeId: existingEmployee.id,
        invitedById: data.invitedById,
        invitedByRoleSlug: data.invitedByRoleSlug,
      });
    }

    const invitation = await renewEmailInvitation(this.prisma, {
      email,
      roleId: data.roleId,
      departmentId: data.departmentId ?? null,
      invitedById: data.invitedById,
      employeeId: null,
    });
    await this.sendInvitationEmail(invitation);
    return invitation;
  }

  /** One-time link with no email. The person joins as Observer and sets their own login. */
  async issueOpenLink(data: { invitedById: string; invitedByRoleSlug: string }) {
    const role = await this.prisma.role.findUnique({
      where: { slug: OPEN_INVITE_ROLE_SLUG },
      select: { id: true },
    });
    if (!role) throw new BadRequestException('Observer role is not configured.');
    await this.ownership.assertCanAssignRole({
      actorId: data.invitedById,
      actorRoleSlug: data.invitedByRoleSlug,
      targetEmployeeId: null,
      targetRoleId: role.id,
    });
    const invitation = await createOpenInvitation(this.prisma, {
      roleId: role.id,
      invitedById: data.invitedById,
    });
    return { token: invitation.token, expiresAt: invitation.expiresAt };
  }

  /** One-time link for a profile that has no password yet. */
  async issueAccessLink(data: {
    employeeId: string;
    invitedById: string;
    invitedByRoleSlug: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { id: true, email: true, roleId: true, passwordHash: true, status: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${data.employeeId} not found`);
    if (employee.status === 'TERMINATED') throw new BadRequestException('Account deactivated');
    if (employee.passwordHash) {
      throw new BadRequestException('This employee already has a password.');
    }
    await this.ownership.assertCanAssignRole({
      actorId: data.invitedById,
      actorRoleSlug: data.invitedByRoleSlug,
      targetEmployeeId: employee.id,
      targetRoleId: employee.roleId,
    });
    const invitation = await renewEmailInvitation(this.prisma, {
      email: employee.email,
      roleId: employee.roleId,
      invitedById: data.invitedById,
      employeeId: employee.id,
    });
    await this.sendInvitationEmail(invitation);
    return { token: invitation.token, expiresAt: invitation.expiresAt };
  }

  async findAll() {
    return this.prisma.invitation.findMany({
      include: {
        role: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
      },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return invitation;
  }

  async cancel(id: string) {
    await this.findById(id);
    return this.prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        role: true,
        department: true,
      },
    });
  }

  async resend(id: string) {
    await this.findById(id);
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: { status: 'PENDING', expiresAt: inviteExpiresAt() },
      include: {
        role: true,
        department: true,
      },
    });

    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  private async sendInvitationEmail(params: {
    email: string;
    token: string;
    expiresAt: Date;
    invitedById: string;
  }) {
    if (isOpenInviteEmail(params.email)) return;
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const inviteLink = buildAcceptInviteUrl(appUrl, params.token);
    const replyTo = process.env.RESEND_ADMIN_EMAIL;
    const expiresAtDate = params.expiresAt.toISOString().split('T')[0] ?? '';
    const locale = await this.readInviterLocale(params.invitedById);
    const { subject, html } = buildInvitationEmail({ locale, inviteLink, expiresAtDate });

    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.email],
          reply_to: replyTo ? [replyTo] : undefined,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Failed to send invitation email to ${params.email}: ${errorText}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Resend request failed for ${params.email}: ${message}`);
    }
  }

  private async readInviterLocale(invitedById: string): Promise<string> {
    const inviter = await this.prisma.employee.findUnique({
      where: { id: invitedById },
      select: { interfaceLocale: true },
    });
    return inviter?.interfaceLocale ?? DEFAULT_INTERFACE_LOCALE;
  }
}
