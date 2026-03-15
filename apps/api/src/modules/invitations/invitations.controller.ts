import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { RequirePermission } from '../../common/decorators';

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @RequirePermission('COMPANY', 'ADD')
  @ApiOperation({ summary: 'Create employee invitation' })
  async create(
    @Body() body: { email: string; roleId: string; departmentId?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.invitationsService.create({
      ...body,
      invitedById: user.id,
    });
  }

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List all invitations' })
  async findAll() {
    return this.invitationsService.findAll();
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get invitation by ID' })
  async findOne(@Param('id') id: string) {
    return this.invitationsService.findById(id);
  }

  @Delete(':id')
  @RequirePermission('COMPANY', 'ADD')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel invitation' })
  async cancel(@Param('id') id: string) {
    await this.invitationsService.cancel(id);
  }

  @Post(':id/resend')
  @RequirePermission('COMPANY', 'ADD')
  @ApiOperation({ summary: 'Resend invitation' })
  async resend(@Param('id') id: string) {
    return this.invitationsService.resend(id);
  }
}
