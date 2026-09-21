import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  FUNCTION_CATALOG_MODULE,
  parseCatalogContentPatchBody,
  parseCatalogContentWriteBody,
} from '@nbos/shared';
import { hasCallerPermission } from '../../common/authorization/caller-permission';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { FunctionCatalogAttachmentsService } from './function-catalog-attachments.service';
import { FunctionCatalogService } from './function-catalog.service';
import { mapCatalogWriteError } from './map-catalog-write-error';

function canManageCatalogContent(user: CurrentUserPayload): boolean {
  return (
    hasCallerPermission(user.permissions, FUNCTION_CATALOG_MODULE, 'EDIT') ||
    hasCallerPermission(user.permissions, FUNCTION_CATALOG_MODULE, 'ADD')
  );
}

@ApiTags('Delivery function catalog')
@ApiBearerAuth()
@Controller('delivery-functions')
export class FunctionCatalogController {
  constructor(
    private readonly service: FunctionCatalogService,
    private readonly attachments: FunctionCatalogAttachmentsService,
  ) {}

  @Get()
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List function catalog cards without units or rates' })
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listOperational(canManageCatalogContent(user), {
      page,
      pageSize,
      search,
      category,
      status,
    });
  }

  @Get(':id')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Read one function instruction without units or rates' })
  getById(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOperational(id, canManageCatalogContent(user));
  }

  @Post()
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create a draft function. Units and rates are rejected.' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: unknown) {
    try {
      return this.service.createDraft(parseCatalogContentWriteBody(body), user.id);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Patch(':id/content')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a new content version. Does not change price versions.' })
  replaceContent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    try {
      return this.service.replaceContent(id, parseCatalogContentPatchBody(body), user.id);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Post(':id/activate')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Publish catalog content as ACTIVE. Units are not required.' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(id);
  }

  @Post(':id/archive')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'DELETE')
  @ApiOperation({ summary: 'Archive a function that is not in use. No hard delete.' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.archive(id);
  }

  @Post(':id/attachments')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Attach a company FileAsset to the latest content version' })
  attach(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { fileAssetId?: string; caption?: string | null; sortOrder?: number },
  ) {
    return this.attachments.attach(id, body, user);
  }
}
