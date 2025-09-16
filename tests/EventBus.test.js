import { describe, it, expect, beforeEach, vi } from 'vitest';
import EventBus from '../src/EventBus';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('#subscribe', () => {
    it('should add a callback to the event', () => {
      const callback = vi.fn();
      eventBus.subscribe('test', callback);

      expect(eventBus.subscribers.get('test')).toContain(callback);
    });

    it('should support multiple callbacks for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.subscribe('test', callback1);
      eventBus.subscribe('test', callback2);

      expect(eventBus.subscribers.get('test')).toHaveLength(2);
    });
  });

  describe('#unsubscribe', () => {
    it('should remove a callback from the event', () => {
      const callback = vi.fn();
      eventBus.subscribe('test', callback);
      eventBus.unsubscribe('test', callback);

      expect(eventBus.subscribers.get('test')).not.toContain(callback);
    });

    it('should not throw error when unsubscribing non-existent event', () => {
      const callback = vi.fn();
      expect(() => eventBus.unsubscribe('nonexistent', callback)).not.toThrow();
    });
  });

  describe('#publish', () => {
    it('should call all subscribed callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.subscribe('test', callback1);
      eventBus.subscribe('test', callback2);

      eventBus.publish('test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should pass data to callbacks', () => {
      const callback = vi.fn();

      eventBus.subscribe('test', callback);
      eventBus.publish('test', 'hello');

      expect(callback).toHaveBeenCalledWith('hello');
    });

    it('should not throw error when publishing to non-existent event', () => {
      expect(() => eventBus.publish('nonexistent')).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();
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

      expect(eventBus.subscribers.size).toBe(0);
    });
  });
});