import { IsOptional, IsUUID } from 'class-validator';

export class CheckRegistryAllDto {
  /** `nextCursor` from the previous page; omit (or null) to start a new run. */
  @IsOptional()
  @IsUUID()
  cursor?: string | null;
}
