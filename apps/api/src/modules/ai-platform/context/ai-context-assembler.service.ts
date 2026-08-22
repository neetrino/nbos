import { Injectable } from '@nestjs/common';
import {
  assembleAuthorizedContext,
  type AiContextAssembleRequest,
  type AiContextAssembleResult,
} from '@nbos/shared';

/**
 * Nest boundary over the shared assembler. Callers must already have an ALLOW
 * decision and purpose-built projections — this service never loads Prisma
 * domain rows.
 */
@Injectable()
export class AiContextAssemblerService {
  assemble(request: AiContextAssembleRequest): AiContextAssembleResult {
    return assembleAuthorizedContext(request);
  }
}
