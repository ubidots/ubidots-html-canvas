import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EventEmitter from '../event-emitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
    // Mock console to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create an EventEmitter instance', () => {
      expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it('should register and trigger event handlers', () => {
      const handler = vi.fn();
      emitter.on('test-event', handler);

      emitter.emit('test-event', 'test-data');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('test-data');
    });

    it('should handle events without data', () => {
      const handler = vi.fn();
      emitter.on('test-event', handler);

      emitter.emit('test-event');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Multiple Listeners', () => {
    it('should support multiple listeners for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);
      emitter.on('test-event', handler3);

      emitter.emit('test-event', 'shared-data');

      expect(handler1).toHaveBeenCalledWith('shared-data');
      expect(handler2).toHaveBeenCalledWith('shared-data');
      expect(handler3).toHaveBeenCalledWith('shared-data');
    });

    it('should maintain execution order of handlers', () => {
      const executionOrder: number[] = [];

      emitter.on('test-event', () => executionOrder.push(1));
      emitter.on('test-event', () => executionOrder.push(2));
      emitter.on('test-event', () => executionOrder.push(3));

      emitter.emit('test-event');

      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('Unsubscribe Functionality', () => {
    it('should return unsubscribe function from on()', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('test-event', handler);

      expect(typeof unsubscribe).toBe('function');

      emitter.emit('test-event', 'data1');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      emitter.emit('test-event', 'data2');
      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should remove specific handler with off()', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);

      emitter.off('test-event', handler1);
      emitter.emit('test-event', 'data');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should remove all handlers with off() when no handler specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);

      emitter.off('test-event');
      emitter.emit('test-event', 'data');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle off() for non-existent events gracefully', () => {
      expect(() => {
        emitter.off('non-existent-event');
      }).not.toThrow();
    });

    it('should handle off() for non-existent handlers gracefully', () => {
      const handler = vi.fn();
      emitter.on('test-event', handler);

      expect(() => {
        emitter.off('test-event', vi.fn()); // Different handler
      }).not.toThrow();
    });
  });

  describe('Once Functionality', () => {
    it('should execute handler only once', () => {
      const handler = vi.fn();
      emitter.once('test-event', handler);

      emitter.emit('test-event', 'data1');
      emitter.emit('test-event', 'data2');
      emitter.emit('test-event', 'data3');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('data1');
    });

    it('should return unsubscribe function from once()', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.once('test-event', handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      emitter.emit('test-event', 'data');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should auto-unsubscribe after execution', () => {
      const handler = vi.fn();
      emitter.once('test-event', handler);

      expect(emitter.listenerCount('test-event')).toBe(1);

      emitter.emit('test-event', 'data');

      expect(emitter.listenerCount('test-event')).toBe(0);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Isolation', () => {
    it('should isolate handler errors and continue executing other handlers', () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 failed');
      });
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);
      emitter.on('test-event', handler3);

      emitter.emit('test-event', 'data');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('data');
      expect(handler3).toHaveBeenCalledWith('data');
    });

    it('should log handler errors', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });

      emitter.on('test-event', errorHandler);
      emitter.emit('test-event', 'data');

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ERROR] Error in event handler for 'test-event'",
        expect.objectContaining({
          message: 'Test error',
        })
      );
    });

    it('should handle multiple failing handlers', () => {
      const handler1 = vi.fn(() => {
        throw new Error('Error 1');
      });
      const handler2 = vi.fn(() => {
        throw new Error('Error 2');
      });
      const handler3 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);
      emitter.on('test-event', handler3);

      expect(() => {
        emitter.emit('test-event', 'data');
      }).not.toThrow();

      expect(handler3).toHaveBeenCalledWith('data');
    });
  });

  describe('Memory Management', () => {
    it('should clean up empty event sets when all handlers are removed', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test-event', handler1);
      emitter.on('test-event', handler2);

      expect(emitter.eventNames()).toContain('test-event');

      emitter.off('test-event', handler1);
      expect(emitter.eventNames()).toContain('test-event');

      emitter.off('test-event', handler2);
      expect(emitter.eventNames()).not.toContain('test-event');
    });

    it('should remove all listeners with removeAllListeners()', () => {
      emitter.on('event1', vi.fn());
      emitter.on('event2', vi.fn());
      emitter.on('event3', vi.fn());

      expect(emitter.eventNames().length).toBe(3);

      emitter.removeAllListeners();

      expect(emitter.eventNames().length).toBe(0);
      expect(emitter.listenerCount('event1')).toBe(0);
      expect(emitter.listenerCount('event2')).toBe(0);
      expect(emitter.listenerCount('event3')).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should return correct listener count', () => {
      expect(emitter.listenerCount('test-event')).toBe(0);

      emitter.on('test-event', vi.fn());
      expect(emitter.listenerCount('test-event')).toBe(1);

      emitter.on('test-event', vi.fn());
      expect(emitter.listenerCount('test-event')).toBe(2);

      emitter.on('other-event', vi.fn());
      expect(emitter.listenerCount('test-event')).toBe(2);
      expect(emitter.listenerCount('other-event')).toBe(1);
    });

    it('should return all event names', () => {
      expect(emitter.eventNames()).toEqual([]);

      emitter.on('event1', vi.fn());
      emitter.on('event2', vi.fn());
      emitter.on('event3', vi.fn());

      const eventNames = emitter.eventNames();
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toContain('event3');
      expect(eventNames.length).toBe(3);
    });

    it('should return correct listener count for non-existent events', () => {
      expect(emitter.listenerCount('non-existent')).toBe(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle many listeners efficiently', () => {
      const handlers = Array.from({ length: 1000 }, () => vi.fn());

      // Add many handlers
      handlers.forEach(handler => {
        emitter.on('performance-test', handler);
      });

      expect(emitter.listenerCount('performance-test')).toBe(1000);

      // Emit event
      const startTime = Date.now();
      emitter.emit('performance-test', 'data');
      const endTime = Date.now();

      // Should complete quickly (< 100ms even on slow machines)
      expect(endTime - startTime).toBeLessThan(100);

      // All handlers should have been called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledWith('data');
      });
    });

    it('should handle empty event emissions gracefully', () => {
      expect(() => {
        emitter.emit('non-existent-event', 'data');
      }).not.toThrow();
    });

    it('should handle complex data types', () => {
      const handler = vi.fn();
      emitter.on('complex-data', handler);

      const complexData = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        nullValue: null,
        undefinedValue: undefined,
      };

      emitter.emit('complex-data', complexData);

      expect(handler).toHaveBeenCalledWith(complexData);
    });

    it('should handle rapid fire events', () => {
      const handler = vi.fn();
      emitter.on('rapid-fire', handler);

      for (let i = 0; i < 100; i++) {
        emitter.emit('rapid-fire', i);
      }

      expect(handler).toHaveBeenCalledTimes(100);
      expect(handler).toHaveBeenNthCalledWith(1, 0);
      expect(handler).toHaveBeenNthCalledWith(100, 99);
    });
  });

  describe('Handler Lifecycle', () => {
    it('should not allow duplicate handlers (Set behavior)', () => {
      const handler = vi.fn();

      emitter.on('test-event', handler);
      emitter.on('test-event', handler); // Re-register same handler

      expect(emitter.listenerCount('test-event')).toBe(1); // Set prevents duplicates

      emitter.emit('test-event', 'data');

      // Should be called only once since Set doesn't allow duplicates
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle removing handler that was registered multiple times', () => {
      const handler = vi.fn();

      emitter.on('test-event', handler);
      emitter.on('test-event', handler); // This won't add a duplicate

      expect(emitter.listenerCount('test-event')).toBe(1); // Still only 1

      emitter.off('test-event', handler);

      expect(emitter.listenerCount('test-event')).toBe(0); // Completely removed

      emitter.emit('test-event', 'data');
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
