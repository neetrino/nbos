import { Body, Controller, Param, Post } from '@nestjs/common';
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
import { CreateCoreCollectionDto } from './dto/create-core-collection.dto';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';

@ApiTags('Messenger Core')
@ApiBearerAuth()
@Controller('messenger/core/collections')
export class MessengerCoreCollectionController {
  constructor(private readonly collections: MessengerCoreCollectionService) {}

  @Post()
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Create a zone-scoped Collection (does not grant conversation ACL)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateCoreCollectionDto) {
    return this.collections.createCollection(user.id, body);
  }

  @Post(':id/members')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Add a SHARED Collection member (does not grant conversation ACL)' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionMemberDto,
  ) {
    return this.collections.addMember(id, user.id, body.employeeId);
  }

  @Post(':id/items')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Add a conversation; rejects cross-zone items' })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: AddCoreCollectionItemDto,
  ) {
    return this.collections.addItem(id, user.id, body.conversationId);
  }
}
