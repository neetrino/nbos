import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('create', () => {
    it('should create a notification', () => {
      const result = service.create({
        type: 'info',
        recipientId: 'user-1',
        title: 'Test',
        body: 'Test body',
      });

      expect(result.id).toBeDefined();
      expect(result.recipientId).toBe('user-1');
      expect(result.title).toBe('Test');
      expect(result.isRead).toBe(false);
    });

    it('should prepend new notifications (newest first)', () => {
      service.create({ type: 'a', recipientId: 'u1', title: 'First', body: '' });
      service.create({ type: 'b', recipientId: 'u1', title: 'Second', body: '' });

      const result = service.findByUser('u1');
      expect(result.items[0]!.title).toBe('Second');
      expect(result.items[1]!.title).toBe('First');
    });

    it('should set optional fields to null when not provided', () => {
      const result = service.create({
        type: 'info',
        recipientId: 'u1',
        title: 'T',
        body: 'B',
      });

      expect(result.link).toBeNull();
      expect(result.entityType).toBeNull();
      expect(result.entityId).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return empty for unknown user', () => {
      const result = service.findByUser('unknown');
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should paginate results', () => {
      for (let i = 0; i < 25; i++) {
        service.create({ type: 'x', recipientId: 'u1', title: `N${i}`, body: '' });
      }

      const page1 = service.findByUser('u1', { page: 1, pageSize: 10 });
      const page2 = service.findByUser('u1', { page: 2, pageSize: 10 });
      const page3 = service.findByUser('u1', { page: 3, pageSize: 10 });

      expect(page1.items.length).toBe(10);
      expect(page2.items.length).toBe(10);
      expect(page3.items.length).toBe(5);
      expect(page1.meta.totalPages).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const created = service.create({ type: 'x', recipientId: 'u1', title: 'T', body: '' });
      expect(created.isRead).toBe(false);

      const updated = service.markAsRead(created.id, 'u1');
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException for missing notification', () => {
      expect(() => service.markAsRead('bad-id', 'u1')).toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', () => {
      service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });
      service.create({ type: 'x', recipientId: 'u1', title: 'T3', body: '' });

      const result = service.markAllAsRead('u1');
      expect(result.updated).toBe(3);

      const count = service.getUnreadCount('u1');
      expect(count.count).toBe(0);
    });

    it('should skip already-read notifications', () => {
      const n = service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      service.markAsRead(n.id, 'u1');
      service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });

      const result = service.markAllAsRead('u1');
      expect(result.updated).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for unknown user', () => {
      expect(service.getUnreadCount('unknown')).toEqual({ count: 0 });
    });

    it('should count only unread notifications', () => {
      service.create({ type: 'x', recipientId: 'u1', title: 'T1', body: '' });
      const n2 = service.create({ type: 'x', recipientId: 'u1', title: 'T2', body: '' });
      service.create({ type: 'x', recipientId: 'u1', title: 'T3', body: '' });

      service.markAsRead(n2.id, 'u1');

      expect(service.getUnreadCount('u1')).toEqual({ count: 2 });
    });
  });
});
