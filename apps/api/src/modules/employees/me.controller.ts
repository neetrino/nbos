import { Controller, Get, Put, Body, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismaClient } from '@nbos/database';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PRISMA_TOKEN } from '../../database.module';

interface UpdateProfileBody {
  phone?: string;
  telegram?: string;
  avatar?: string;
  birthday?: string | null;
}

@ApiTags('Me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  @Get()
  @ApiOperation({ summary: 'Get current employee profile with role, permissions, and departments' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    if (!user?.id || !user.meProfile) {
      throw new NotFoundException('Employee record not found for this user');
    }

    return {
      ...user.meProfile,
      permissions: user.permissions ?? {},
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update own profile (phone, telegram, avatar, birthday)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true },
        telegram: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        birthday: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  async updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() body: UpdateProfileBody) {
    const data: { phone?: string; telegram?: string; avatar?: string; birthday?: Date | null } = {};
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.telegram !== undefined) data.telegram = body.telegram;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.birthday !== undefined) {
      data.birthday = body.birthday ? new Date(body.birthday) : null;
    }

    return this.prisma.employee.update({
      where: { id: user.id },
      data,
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
        departments: {
          include: { department: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  }
}
