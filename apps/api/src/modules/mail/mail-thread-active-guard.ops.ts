import { assertEntityIsActive } from '../../common/lifecycle/entity-lifecycle-guards';
import type { MailThreadWithAccount } from './mail-thread-access.ops';

/** Blocks mutations on threads already in Trash. */
export function assertMailThreadIsActive(thread: MailThreadWithAccount): void {
  assertEntityIsActive(thread, 'trashedAt', 'Thread');
}
