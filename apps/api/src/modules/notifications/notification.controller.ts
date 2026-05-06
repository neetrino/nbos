import { Body, Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'includeArchived', required: false })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.notificationService.findByUser(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      category,
      includeArchived: includeArchived === 'true',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification preferences by event type and channels' })
  async getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.getUserPreferences(user.id);
  }

  @Patch('preferences/:eventType')
  @ApiOperation({ summary: 'Update one notification preference row for current user' })
  async patchPreference(
    @CurrentUser() user: CurrentUserPayload,
    @Param('eventType') eventType: string,
    @Body() body: { enabled?: boolean; channels?: string[] },
  ) {
    return this.notificationService.updateUserPreference(user.id, eventType, body);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive notification' })
  async archive(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.archive(id, user.id);
  }
}
