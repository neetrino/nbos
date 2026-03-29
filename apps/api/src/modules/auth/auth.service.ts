import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }

  async login(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true, lastName: true, passwordHash: true },
    });

    if (!employee?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(employee.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: employee.id, email: employee.email };
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return {
      accessToken,
      user: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    };
  }

  async acceptInvite(token: string, firstName: string, lastName: string, password: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation has already been used or cancelled');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const employee = await this.prisma.employee.create({
      data: {
        email: invitation.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        roleId: invitation.roleId,
      },
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

    this.logger.log(`Employee ${employee.id} registered via invitation (${employee.email})`);

    return { message: 'Account created successfully. You can now sign in.' };
  }

  async getInvitationInfo(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      select: {
        email: true,
        status: true,
        expiresAt: true,
        role: { select: { name: true } },
      },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    return { email: invitation.email, roleName: invitation.role.name };
  }
}
