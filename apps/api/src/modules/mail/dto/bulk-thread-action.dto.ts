import { ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';

export class BulkThreadActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  threadIds!: string[];
}
