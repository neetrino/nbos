import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SETTINGS_MODULE } from '@nbos/shared';
import { RequirePermission } from '../../common/decorators';
import { PlatformTrashInventoryService } from './platform-trash-inventory.service';
import { PlatformTrashPurgeService } from './platform-trash-purge.service';

@ApiTags('Platform Lifecycle')
@Controller('platform/lifecycle')
export class PlatformLifecycleController {
  constructor(
    private readonly trashInventoryService: PlatformTrashInventoryService,
    private readonly trashPurgeService: PlatformTrashPurgeService,
  ) {}

  @Get('trash-inventory')
  @RequirePermission(SETTINGS_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Cross-module trash inventory (admin)',
    description:
      'Aggregated recoverable-trash counts and purge-eligible rows per lifecycle profile. Settings / Admin use.',
  })
  getTrashInventory() {
    return this.trashInventoryService.getInventory();
  }

  @Get('retention-rules')
  @RequirePermission(SETTINGS_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Platform trash retention rules registry',
    description: 'Per-entity retention defaults and scheduled purge job references (Phase 7.3).',
  })
  listRetentionRules() {
    return { rules: this.trashInventoryService.listRetentionRules() };
  }

  @Post('purge/run')
  @RequirePermission(SETTINGS_MODULE, 'DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run automated trash retention purge (Credentials + Drive)',
    description:
      'Hard-purges trashed credentials and Drive files past resolved retention TTL. Writes platform audit event.',
  })
  runRetentionPurge() {
    return this.trashPurgeService.runRetentionPurge();
  }
}
