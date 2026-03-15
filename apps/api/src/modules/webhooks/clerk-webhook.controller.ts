import { Controller, Post, Req, RawBodyRequest, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Webhook } from 'svix';
import { Public } from '../../common/decorators';
import { EmployeesService } from '../employees/employees.service';
import { PrismaClient } from '@nbos/database';
import { Inject } from '@nestjs/common';
import { PRISMA_TOKEN } from '../../database.module';
import type { Request } from 'express';

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
  };
  type: string;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly employeesService: EmployeesService,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  @Post('clerk')
  @Public()
  @ApiExcludeEndpoint()
  async handleClerkWebhook(@Req() req: RawBodyRequest<Request>) {
    const secret = this.configService.get<string>('CLERK_WEBHOOK_SIGNING_SECRET');
    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix headers');
    }

    const wh = new Webhook(secret);
    let event: ClerkUserEvent;

    try {
      const body = req.rawBody ?? req.body;
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkUserEvent;
    } catch (err) {
      this.logger.warn('Clerk webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Clerk webhook: ${event.type}`);

    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.handleUserCreatedOrUpdated(event);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event);
        break;
      default:
        this.logger.log(`Unhandled Clerk event: ${event.type}`);
    }

    return { received: true };
  }

  private async handleUserCreatedOrUpdated(event: ClerkUserEvent) {
    const { id: clerkUserId, email_addresses, first_name, last_name } = event.data;
    const primaryEmail = email_addresses[0]?.email_address;
    if (!primaryEmail) return;

    const invitation = await this.prisma.invitation.findUnique({
      where: { email: primaryEmail },
    });

    if (invitation && invitation.status === 'PENDING') {
      const roleId = invitation.roleId;

      const employee = await this.employeesService.upsertFromClerk({
        clerkUserId,
        email: primaryEmail,
        firstName: first_name ?? '',
        lastName: last_name ?? '',
        roleId,
      });

      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', employeeId: employee.id },
      });

      if (invitation.departmentId) {
        await this.prisma.employeeDepartment.create({
          data: {
            employeeId: employee.id,
            departmentId: invitation.departmentId,
            isPrimary: true,
          },
        });
      }

      this.logger.log(`Employee created from invitation: ${primaryEmail}`);
    } else {
      const existing = await this.employeesService.findByClerkUserId(clerkUserId);
      if (existing) {
        await this.prisma.employee.update({
          where: { id: existing.id },
          data: {
            email: primaryEmail,
            firstName: first_name ?? existing.firstName,
            lastName: last_name ?? existing.lastName,
          },
        });
        this.logger.log(`Employee updated: ${primaryEmail}`);
      } else {
        const observerRole = await this.prisma.role.findUnique({
          where: { slug: 'observer' },
        });
        if (observerRole) {
          await this.employeesService.upsertFromClerk({
            clerkUserId,
            email: primaryEmail,
            firstName: first_name ?? '',
            lastName: last_name ?? '',
            roleId: observerRole.id,
          });
          this.logger.log(`Employee created as observer: ${primaryEmail}`);
        }
      }
    }
  }

  private async handleUserDeleted(event: ClerkUserEvent) {
    const { id: clerkUserId } = event.data;
    const employee = await this.employeesService.findByClerkUserId(clerkUserId);
    if (employee) {
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { status: 'TERMINATED' },
      });
      this.logger.log(`Employee terminated: ${employee.email}`);
    }
  }
}
