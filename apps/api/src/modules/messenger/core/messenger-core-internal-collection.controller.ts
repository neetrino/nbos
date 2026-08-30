import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import {
  AddCoreCollectionItemDto,
  AddCoreCollectionMemberDto,
} from './dto/add-core-collection-item.dto';
import { CreateInternalCollectionDto } from './dto/create-internal-collection.dto';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';

@ApiTags('Messenger Core Internal')
@ApiBearerAuth()
@Controller('messenger/core/internal/collections')
export class MessengerCoreInternalCollectionController {
  constructor(private readonly collections: MessengerCoreCollectionService) {}

  @Get()
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List Internal Collections including built-in Favorites' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.collections.listInternal(user.id);
  }

  @Post()
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Create an Internal PERSONAL or SHARED Collection' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateInternalCollectionDto) {
    return this.collections.createInternal(user.id, body);
  }

  @Get(':id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get an Internal Collection; items are ACL-filtered' })
  get(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.collections.getInternal(id, user.id);
  }

  @Post(':id/members')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Add a SHARED Internal Collection member (does not grant ACL)' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionMemberDto,
  ) {
    return this.collections.addInternalMember(id, user.id, body.employeeId);
  }

  @Post(':id/items')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Add an Internal conversation to a Collection' })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionItemDto,
  ) {
    return this.collections.addInternalItem(id, user.id, body.conversationId);
  }

  @Delete(':id/items/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Remove a conversation from an Internal Collection' })
  removeItem(
    @Param('id') id: string,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.collections.removeItem(id, user.id, conversationId);
  }
}
