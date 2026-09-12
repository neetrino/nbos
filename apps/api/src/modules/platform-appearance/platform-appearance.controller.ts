import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MAX_WALLPAPER_BYTES,
  parseWallpaperSlot,
  WALLPAPER_CACHE_CONTROL,
  WALLPAPER_MIME,
} from '@nbos/shared';
import {
  CurrentUser,
  Public,
  RequirePermission,
  SkipTransform,
  type CurrentUserPayload,
} from '../../common/decorators';
import { PlatformAppearanceService } from './platform-appearance.service';

type MemoryUpload = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

@ApiTags('Platform Appearance')
@Controller('v1/platform/appearance')
export class PlatformAppearanceController {
  constructor(private readonly appearance: PlatformAppearanceService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read platform wallpaper metadata' })
  getAppearance() {
    return this.appearance.getAppearance();
  }

  @Get('wallpaper/:slot')
  @Public()
  @SkipTransform()
  @Header('Content-Type', WALLPAPER_MIME)
  @Header('Cache-Control', WALLPAPER_CACHE_CONTROL)
  @ApiOperation({ summary: 'Read cached platform wallpaper bytes' })
  async getWallpaperBytes(@Param('slot') slotParam: string): Promise<StreamableFile> {
    const bytes = await this.appearance.readWallpaperBytes(requireSlot(slotParam));
    return new StreamableFile(bytes);
  }

  @Put('wallpaper/:slot')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_WALLPAPER_BYTES } }))
  uploadWallpaper(
    @Param('slot') slotParam: string,
    @UploadedFile() file: MemoryUpload | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appearance.uploadWallpaper(requireSlot(slotParam), requireUpload(file), user.id);
  }

  @Delete('wallpaper/:slot')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  clearWallpaper(@Param('slot') slotParam: string, @CurrentUser() user: CurrentUserPayload) {
    return this.appearance.clearWallpaper(requireSlot(slotParam), user.id);
  }
}

function requireSlot(slotParam: string) {
  const slot = parseWallpaperSlot(slotParam);
  if (!slot) {
    throw new BadRequestException('Wallpaper slot must be light or dark.');
  }
  return slot;
}

function requireUpload(file: MemoryUpload | undefined) {
  if (!file?.buffer?.byteLength) {
    throw new BadRequestException('Choose a WebP file to upload.');
  }
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    bytes: file.buffer,
  };
}
