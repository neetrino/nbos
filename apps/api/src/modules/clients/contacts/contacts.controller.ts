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
import { Public } from '../../../common/decorators';
import { ContactsService } from './contacts.service';

@ApiTags('Clients / Contacts')
@ApiBearerAuth()
@Controller('clients/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      role,
      search,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Post()
  @Public()
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
    },
  ) {
    return this.contactsService.create(body);
  }

  @Put(':id')
  @Public()
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
    },
  ) {
    return this.contactsService.update(id, body);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete contact' })
  async remove(@Param('id') id: string) {
    await this.contactsService.delete(id);
  }
}
