import { Injectable } from '@nestjs/common';
import {
  createDisabledPersistentMemoryStore,
  type AiMemoryWriteResult,
  type AiPersistentMemoryRecord,
  type AiPersistentMemoryWriteInput,
} from '@nbos/shared';

/** Persistent memory stays disabled in Phase 1. Writes still reject secrets. */
@Injectable()
export class AiPersistentMemoryService {
  private readonly store = createDisabledPersistentMemoryStore();

  isEnabled(): boolean {
    return this.store.isEnabled();
  }

  read(): Promise<AiPersistentMemoryRecord[]> {
    return this.store.read();
  }

  write(input: AiPersistentMemoryWriteInput): Promise<AiMemoryWriteResult> {
    return this.store.write(input);
  }
}
