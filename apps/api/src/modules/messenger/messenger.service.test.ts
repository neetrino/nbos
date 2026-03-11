import { describe, it, expect, beforeEach } from 'vitest';
import { MessengerService } from './messenger.service';

describe('MessengerService', () => {
  let service: MessengerService;

  beforeEach(() => {
    service = new MessengerService();
  });

  describe('getChannels', () => {
    it('should return pre-seeded channels', () => {
      const channels = service.getChannels();
      expect(channels.length).toBeGreaterThanOrEqual(3);
      expect(channels.some((c) => c.name === '#general')).toBe(true);
      expect(channels.some((c) => c.name === '#project-nbos')).toBe(true);
    });
  });

  describe('createChannel', () => {
    it('should create a new channel', () => {
      const channel = service.createChannel('test-channel', 'proj-1', 'project');
      expect(channel.name).toBe('test-channel');
      expect(channel.projectId).toBe('proj-1');
      expect(channel.id).toBeDefined();

      const all = service.getChannels();
      expect(all.length).toBe(4);
    });
  });

  describe('sendMessage + getMessages', () => {
    it('should send and retrieve messages', () => {
      const channels = service.getChannels();
      const general = channels.find((c) => c.name === '#general')!;

      service.sendMessage(general.id, 'user-1', 'John Doe', 'Hello world');

      const result = service.getMessages(general.id);
      expect(result.items.length).toBe(6);
    });

    it('should paginate messages', () => {
      const channel = service.createChannel('paginate-test', 'p1', 'general');
      for (let i = 0; i < 25; i++) {
        service.sendMessage(channel.id, 'u1', 'User', `Msg ${i}`);
      }

      const page1 = service.getMessages(channel.id, { page: 1, pageSize: 10 });
      const page2 = service.getMessages(channel.id, { page: 2, pageSize: 10 });
      const page3 = service.getMessages(channel.id, { page: 3, pageSize: 10 });

      expect(page1.items.length).toBe(10);
      expect(page2.items.length).toBe(10);
      expect(page3.items.length).toBe(5);
      expect(page1.meta.totalPages).toBe(3);
    });

    it('should return empty for unknown channel', () => {
      const result = service.getMessages('nonexistent');
      expect(result.items).toEqual([]);
    });
  });

  describe('direct messages', () => {
    it('should send and retrieve DMs', () => {
      service.sendDirectMessage('user-a', 'Alice', 'user-b', 'Hey Bob');
      service.sendDirectMessage('user-b', 'Bob', 'user-a', 'Hey Alice');

      const result = service.getDirectMessages('user-a', 'user-b');
      expect(result.items.length).toBe(2);
    });

    it('should return same DMs regardless of user order', () => {
      service.sendDirectMessage('x', 'X', 'y', 'test');

      const r1 = service.getDirectMessages('x', 'y');
      const r2 = service.getDirectMessages('y', 'x');
      expect(r1.items.length).toBe(r2.items.length);
    });

    it('should list conversations for a user', () => {
      service.sendDirectMessage('u1', 'User1', 'u2', 'Hi');
      service.sendDirectMessage('u1', 'User1', 'u3', 'Hello');
      service.sendDirectMessage('u4', 'User4', 'u1', 'Hey');

      const convos = service.getDirectConversations('u1');
      expect(convos.length).toBe(3);
    });

    it('should return empty conversations for unknown user', () => {
      const convos = service.getDirectConversations('nobody');
      expect(convos.length).toBe(0);
    });
  });
});
