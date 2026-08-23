import { IsString, MinLength } from 'class-validator';

export class RotateProviderKeyDto {
  @IsString()
  @MinLength(1)
  apiKey!: string;
}
