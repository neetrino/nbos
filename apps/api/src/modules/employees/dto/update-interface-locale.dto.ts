import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { WRITABLE_INTERFACE_LOCALES, type WritableInterfaceLocale } from '@nbos/shared';

export class UpdateInterfaceLocaleDto {
  @ApiProperty({ enum: WRITABLE_INTERFACE_LOCALES, example: 'en' })
  @IsIn([...WRITABLE_INTERFACE_LOCALES], {
    message: 'interfaceLocale must be one of: en, ru',
  })
  interfaceLocale!: WritableInterfaceLocale;
}
