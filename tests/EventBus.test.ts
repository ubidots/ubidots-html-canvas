import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus from '../src/EventBus';
import type { EventCallback } from '../src/types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('#subscribe', () => {
    it('should add a callback to the event', () => {
      const callback: EventCallback = vi.fn();
      eventBus.subscribe('test', callback);

      expect(eventBus.getSubscriberCount('test')).toBe(1);
    });

    it('should support multiple callbacks for the same event', () => {
      const callback1: EventCallback = vi.fn();
      const callback2: EventCallback = vi.fn();

      eventBus.subscribe('test', callback1);
      eventBus.subscribe('test', callback2);

      expect(eventBus.getSubscriberCount('test')).toBe(2);
    });
  });

  describe('#unsubscribe', () => {
    it('should remove a callback from the event', () => {
      const callback: EventCallback = vi.fn();
      eventBus.subscribe('test', callback);
      eventBus.unsubscribe('test', callback);

      expect(eventBus.getSubscriberCount('test')).toBe(0);
    });

    it('should not throw error when unsubscribing non-existent event', () => {
      const callback: EventCallback = vi.fn();
      expect(() => eventBus.unsubscribe('nonexistent', callback)).not.toThrow();
    });
  });

  describe('#publish', () => {
    it('should call all subscribed callbacks', () => {
      const callback1: EventCallback = vi.fn();
      const callback2: EventCallback = vi.fn();

      eventBus.subscribe('test', callback1);
      eventBus.subscribe('test', callback2);

      eventBus.publish('test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should pass data to callbacks', () => {
      const callback: EventCallback<string> = vi.fn();

      eventBus.subscribe('test', callback);
      eventBus.publish('test', 'hello');

      expect(callback).toHaveBeenCalledWith('hello');
    });

    it('should not throw error when publishing to non-existent event', () => {
      expect(() => eventBus.publish('nonexistent')).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback: EventCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback: EventCallback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.subscribe('test', errorCallback);
      eventBus.subscribe('test', normalCallback);

      expect(() => eventBus.publish('test')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('#clear', () => {
    it('should remove all subscribers', () => {
      eventBus.subscribe('test1', vi.fn());
      eventBus.subscribe('test2', vi.fn());

      eventBus.clear();

      expect(eventBus.getSubscriberCount('test1')).toBe(0);
      expect(eventBus.getSubscriberCount('test2')).toBe(0);
    });
  });

  describe('#getSubscriberCount', () => {
    it('should return correct subscriber count', () => {
      expect(eventBus.getSubscriberCount('test')).toBe(0);

      eventBus.subscribe('test', vi.fn());
      expect(eventBus.getSubscriberCount('test')).toBe(1);

      eventBus.subscribe('test', vi.fn());
      expect(eventBus.getSubscriberCount('test')).toBe(2);
    });
  });

  describe('#getEventNames', () => {
    it('should return all event names with subscribers', () => {
      eventBus.subscribe('event1', vi.fn());
      eventBus.subscribe('event2', vi.fn());

      const eventNames = eventBus.getEventNames();
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toHaveLength(2);
    });
  });

  describe('#hasSubscribers', () => {
    it('should return true if event has subscribers', () => {
      expect(eventBus.hasSubscribers('test')).toBe(false);

      eventBus.subscribe('test', vi.fn());
      expect(eventBus.hasSubscribers('test')).toBe(true);
    });
  });
});