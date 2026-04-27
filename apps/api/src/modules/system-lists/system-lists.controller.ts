import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import {
  SystemListsService,
  CreateSystemListOptionDto,
  UpdateSystemListOptionDto,
} from './system-lists.service';

@ApiTags('System Lists')
@ApiBearerAuth()
@Controller('system-lists')
export class SystemListsController {
  constructor(private readonly systemListsService: SystemListsService) {}

  @Get('keys')
  @ApiOperation({ summary: 'Get all list keys (for admin UI)' })
  async getListKeys() {
    return this.systemListsService.getListKeys();
  }

  @Get('options/:listKey')
  @ApiOperation({ summary: 'Get options for one list (for dropdowns)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getOptionsByKey(
    @Param('listKey') listKey: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.systemListsService.getOptionsByKey(listKey, {
      includeInactive: includeInactive === 'true',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all options, optionally filtered by listKey' })
  @ApiQuery({ name: 'listKey', required: false, type: String })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getAllOptions(
    @Query('listKey') listKey?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.systemListsService.getAllOptions({
      listKey,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one option by id' })
  async getById(@Param('id') id: string) {
    return this.systemListsService.getById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create a new list option' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateSystemListOptionDto) {
    return this.systemListsService.create(body, user.id);
  }

  @Patch(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update a list option' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateSystemListOptionDto,
  ) {
    return this.systemListsService.update(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Deactivate a list option' })
  async delete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.systemListsService.delete(id, user.id);
  }
}
