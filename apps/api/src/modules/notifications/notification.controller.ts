import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'userId', required: true, description: 'Recipient user ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notificationService.findByUser(userId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('unread-count')
  @Public()
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiQuery({ name: 'userId', required: true })
  async getUnreadCount(@Query('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @Public()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiQuery({ name: 'userId', required: true })
  async markAsRead(@Param('id') id: string, @Query('userId') userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @Public()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({ name: 'userId', required: true })
  async markAllAsRead(@Query('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
