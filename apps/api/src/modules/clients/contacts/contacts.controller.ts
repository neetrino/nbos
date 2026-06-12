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
import { ContactsService } from './contacts.service';

@ApiTags('Clients / Contacts')
@ApiBearerAuth()
@Controller('clients/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
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

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Post()
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

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore contact from Trash' })
  async restore(@Param('id') id: string) {
    return this.contactsService.restoreFromTrash(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move contact to Trash' })
  async remove(@Param('id') id: string) {
    await this.contactsService.moveToTrash(id);
  }
}
