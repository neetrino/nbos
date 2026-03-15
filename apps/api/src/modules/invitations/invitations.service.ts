import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

const INVITATION_EXPIRY_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(data: {
    email: string;
    roleId: string;
    departmentId?: string;
    invitedById: string;
  }) {
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

    return this.prisma.invitation.create({
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
    const invitation = await this.findById(id);
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

    return this.prisma.invitation.update({
      where: { id },
      data: { status: 'PENDING', expiresAt },
      include: {
        role: true,
        department: true,
      },
    });
  }
}
