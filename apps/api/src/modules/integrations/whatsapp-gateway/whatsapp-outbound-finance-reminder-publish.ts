import type { FinanceClientReminderPublisher } from '../../messenger/core/messenger-finance-reminder.ops';
import type { MessengerPersistedCoreMessageBus } from '../../messenger/core/messenger-persisted-core-message-bus';

/**
 * Hands a worker-persisted Finance reminder to the API process.
 * Does not enqueue another WhatsApp send and does not mark the row delivered.
 */
export function financeReminderBusPublisher(
  bus: MessengerPersistedCoreMessageBus | undefined,
): FinanceClientReminderPublisher | null {
  if (!bus) return null;
  return {
    publishPersistedCoreMessage: async (message) => {
      await bus.publish({
        conversationId: message.conversationId,
        messageId: message.id,
      });
    },
  };
}
