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
import { CreateClientCollectionDto } from './dto/create-client-collection.dto';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';

@ApiTags('Messenger Core Client')
@ApiBearerAuth()
@Controller('messenger/core/client/collections')
export class MessengerCoreClientCollectionController {
  constructor(private readonly collections: MessengerCoreCollectionService) {}

  @Get()
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List Client Collections including built-in Favorites' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.collections.listClient(user.id);
  }

  @Post()
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Create a Client PERSONAL or SHARED Collection' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateClientCollectionDto) {
    return this.collections.createClient(user.id, body);
  }

  @Get(':id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get a Client Collection; items are ACL-filtered' })
  get(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.collections.getClient(id, user.id);
  }

  @Post(':id/members')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Add a SHARED Client Collection member (does not grant ACL)' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionMemberDto,
  ) {
    return this.collections.addClientMember(id, user.id, body.employeeId);
  }

  @Post(':id/items')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Add a Client conversation to a Collection' })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionItemDto,
  ) {
    return this.collections.addClientItem(id, user.id, body.conversationId);
  }

  @Delete(':id/items/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Remove a conversation from a Client Collection' })
  removeItem(
    @Param('id') id: string,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.collections.removeClientItem(id, user.id, conversationId);
  }
}
