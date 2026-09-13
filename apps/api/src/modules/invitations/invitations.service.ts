import { Injectable, Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { DEFAULT_INTERFACE_LOCALE } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';
import { buildInvitationEmail } from './invitation-email';

const INVITATION_EXPIRY_DAYS = 7;
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
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingEmployee) {
      throw new ConflictException('Employee with this email already exists');
    }

    const existingInvitation = await this.prisma.invitation.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingInvitation) {
      throw new ConflictException('Invitation for this email already exists');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email.toLowerCase().trim(),
        roleId: data.roleId,
        departmentId: data.departmentId ?? null,
        invitedById: data.invitedById,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        role: true,
        department: true,
      },
    });

    await this.sendInvitationEmail({
      email: invitation.email,
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
      invitedById: invitation.invitedById,
    });

    return invitation;
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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: { status: 'PENDING', expiresAt },
      include: {
        role: true,
        department: true,
      },
    });

    await this.sendInvitationEmail({
      email: invitation.email,
      invitationId: invitation.id,
      expiresAt: invitation.expiresAt,
      invitedById: invitation.invitedById,
    });

    return invitation;
  }

  private async sendInvitationEmail(params: {
    email: string;
    invitationId: string;
    expiresAt: Date;
    invitedById: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const inviteLink = `${appUrl}/accept-invite?invitationId=${params.invitationId}`;
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
