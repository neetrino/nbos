import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { InputJsonValue } from '@nbos/database';
import {
  CurrentUser,
  RequirePermission,
  type CurrentUserPayload,
} from '../../../common/decorators';
import { ContactsService } from './contacts.service';
import { FindContactMergeCandidatesDto, MergeContactDto } from './dto/merge-contact.dto';

@ApiTags('Clients / Contacts')
@ApiBearerAuth()
@Controller('clients/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermission('CLIENTS', 'VIEW')
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'contactType', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['active', 'trash'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('contactType') contactType?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('scope') scope?: string,
  ) {
    return this.contactsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      contactType,
      role,
      search,
      scope,
    });
  }

  @Get('duplicates')
  @RequirePermission('CLIENTS', 'VIEW')
  @ApiOperation({ summary: 'Search other contacts for merge' })
  async findDuplicates(@Query() query: FindContactMergeCandidatesDto) {
    return this.contactsService.findMergeCandidates({
      q: query.q,
      excludeId: query.excludeId,
    });
  }

  @Get(':id')
  @RequirePermission('CLIENTS', 'VIEW')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Post(':id/merge')
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Merge another Contact into this survivor Contact' })
  async merge(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: MergeContactDto,
  ) {
    return this.contactsService.mergeContacts(
      id,
      { absorbedId: body.absorbedId, fieldChoices: body.fieldChoices },
      { id: user.id, roleSlug: user.role, isPlatformOwner: user.isPlatformOwner === true },
    );
  }

  @Post()
  @RequirePermission('CLIENTS', 'ADD')
  @ApiOperation({ summary: 'Create contact' })
  async create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      role?: string;
      notes?: string;
      messengerLinks?: InputJsonValue;
    },
  ) {
    return this.contactsService.create(body);
  }

  @Put(':id')
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Update contact' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      role?: string;
      notes?: string;
      messengerLinks?: InputJsonValue;
    },
  ) {
    return this.contactsService.update(id, body);
  }

  @Post(':id/phones')
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Add an extra phone to a Contact' })
  async addExtraPhone(@Param('id') id: string, @Body() body: { phone?: string }) {
    return this.contactsService.addExtraPhone(id, body.phone);
  }

  @Delete(':id/phones/:phoneId')
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Remove an extra phone from a Contact' })
  async removeExtraPhone(@Param('id') id: string, @Param('phoneId') phoneId: string) {
    return this.contactsService.removeExtraPhone(id, phoneId);
  }

  @Post(':id/restore')
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Restore contact from Trash' })
  async restore(@Param('id') id: string) {
    return this.contactsService.restoreFromTrash(id);
  }

  @Delete(':id/permanent')
  @RequirePermission('CLIENTS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete trashed contact (cannot be undone)' })
  async permanentRemove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.contactsService.permanentlyDeleteFromTrash(id, user.id);
  }

  @Delete(':id')
  @RequirePermission('CLIENTS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move contact to Trash' })
  async remove(@Param('id') id: string) {
    await this.contactsService.moveToTrash(id);
  }
}
