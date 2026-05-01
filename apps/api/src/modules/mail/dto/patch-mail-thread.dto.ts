import { IsBoolean } from 'class-validator';

export class PatchMailThreadDto {
  @IsBoolean()
  needsBusinessLink!: boolean;
}
