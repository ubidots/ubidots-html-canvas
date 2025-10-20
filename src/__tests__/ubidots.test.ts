import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Ubidots from '../ubidots';

describe('Ubidots Modern Implementation', () => {
  let ubidots: Ubidots;
  let mockParent: { postMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Mock window.parent
    mockParent = { postMessage: vi.fn() };
    Object.defineProperty(window, 'parent', {
      value: mockParent,
      writable: true,
    });

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    // Mock console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    ubidots?.destroy();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance without parameters', () => {
      ubidots = new Ubidots();
      expect(ubidots).toBeInstanceOf(Ubidots);
    });
  });

  describe('Ready Event', () => {
    it('should emit ready event after initialization', async () => {
      ubidots = new Ubidots();

      return new Promise<void>(resolve => {
        ubidots.on('ready', data => {
          expect(data).toEqual({
            timestamp: expect.any(Number),
          });
          expect(data.timestamp).toBeGreaterThan(Date.now() - 100);
          resolve();
        });
      });
    });
  });

  describe('Event Emission and Communication', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should send message to parent via postMessage', () => {
      const testData = { deviceId: 'device-123' };

      ubidots.emit('v1:devices:selected', testData);

      expect(mockParent.postMessage).toHaveBeenCalledWith(
        {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: testData,
        },
        'http://localhost:3000'
      );
    });

    it('should NOT trigger local handlers when emitting', () => {
      const localHandler = vi.fn();
      ubidots.on('v1:devices:selected', localHandler);

      ubidots.emit('v1:devices:selected', { test: 'data' });

      // Local handler should NOT be called (unidirectional communication)
      expect(localHandler).not.toHaveBeenCalled();
      // But should send to parent
      expect(mockParent.postMessage).toHaveBeenCalled();
    });

    it('should not send message when no parent window', () => {
      Object.defineProperty(window, 'parent', {
        value: window, // parent === window means no iframe
        writable: true,
      });

      ubidots.emit('v1:devices:selected', { test: 'data' });

      expect(mockParent.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling from Parent', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should process valid messages from parent', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(handler).toHaveBeenCalledWith({ deviceId: 'device-123' });
    });

    it('should ignore messages from different origins', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      const messageEvent = new MessageEvent('message', {
        origin: 'http://malicious-site.com',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should ignore messages with wrong type', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'other:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Endpoint Validation', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should reject invalid event format for on()', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      const unsubscribe = ubidots.on('invalid-format', vi.fn());

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid event format'),
          context: 'on',
        })
      );

      // Should return safe unsubscribe function
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).not.toThrow();
    });

    it('should reject invalid event format for emit()', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('invalid-format', { test: 'data' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid event format'),
          context: 'emit',
        })
      );

      // Should not send to parent
      expect(mockParent.postMessage).not.toHaveBeenCalled();
    });

    it('should accept valid version-specific endpoints', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      ubidots.emit('v1:devices:selected', { test: 'data' });

      // Should send to parent without errors
      expect(mockParent.postMessage).toHaveBeenCalled();
    });

    it('should accept version-agnostic endpoints', () => {
      const errorHandler = vi.fn();
      const readyHandler = vi.fn();

      ubidots.on('error', errorHandler);
      ubidots.on('ready', readyHandler);

      // Should not emit any validation errors
      expect(errorHandler).not.toHaveBeenCalledWith(expect.objectContaining({ context: 'on' }));
    });
  });

  describe('Multiple Listeners Support', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should support multiple listeners for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      ubidots.on('v1:devices:selected', handler1);
      ubidots.on('v1:devices:selected', handler2);
      ubidots.on('v1:devices:selected', handler3);

      // Simulate message from parent
      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(handler1).toHaveBeenCalledWith({ deviceId: 'device-123' });
      expect(handler2).toHaveBeenCalledWith({ deviceId: 'device-123' });
      expect(handler3).toHaveBeenCalledWith({ deviceId: 'device-123' });
    });

    it('should support individual unsubscribe', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      ubidots.on('v1:devices:selected', handler1);
      const unsubscribe2 = ubidots.on('v1:devices:selected', handler2);

      // Unsubscribe only handler2
      unsubscribe2();

      // Simulate message from parent
      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Once Method', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should execute handler only once', () => {
      const handler = vi.fn();
      ubidots.once('v1:devices:selected', handler);

      // Simulate first message
      const messageEvent1 = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-1' },
        },
      });

      window.dispatchEvent(messageEvent1);
      expect(handler).toHaveBeenCalledTimes(1);

      // Simulate second message
      const messageEvent2 = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-2' },
        },
      });

      window.dispatchEvent(messageEvent2);
      expect(handler).toHaveBeenCalledTimes(1); // Still only once
    });
  });

  describe('Error Handling and Isolation', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should isolate handler errors', () => {
      const errorHandler = vi.fn();
      const workingHandler = vi.fn();

      ubidots.on('error', errorHandler);
      ubidots.on('v1:devices:selected', () => {
        throw new Error('Handler failed!');
      });
      ubidots.on('v1:devices:selected', workingHandler);

      // Simulate message from parent
      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);

      // Working handler should still execute
      expect(workingHandler).toHaveBeenCalled();
    });

    it('should emit structured error events', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('invalid-format', {});

      expect(errorHandler).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid event format'),
        name: 'Error',
        stack: expect.any(String),
        context: 'emit',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Destroy Method', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should emit destroy event', () => {
      const destroyHandler = vi.fn();
      ubidots.on('destroy', destroyHandler);

      ubidots.destroy();

      expect(destroyHandler).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });
    });

    it('should clean up event listeners', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      ubidots.destroy();

      // After destroy, handlers should not respond
      const messageEvent = new MessageEvent('message', {
        origin: 'http://localhost:3000',
        data: {
          type: 'ubidots:event',
          event: 'v1:devices:selected',
          payload: { deviceId: 'device-123' },
        },
      });

      window.dispatchEvent(messageEvent);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Event Format Validation', () => {
    beforeEach(() => {
      ubidots = new Ubidots();
    });

    it('should accept v1 endpoints', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:selected', handler);

      ubidots.emit('v1:devices:selected', { test: 'v1' });
      expect(mockParent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'v1:devices:selected',
          payload: { test: 'v1' },
        }),
        'http://localhost:3000'
      );
    });

    it('should accept v2 endpoints', () => {
      const handler = vi.fn();
      ubidots.on('v2:devices:selected', handler);

      ubidots.emit('v2:devices:selected', { test: 'v2' });
      expect(mockParent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'v2:devices:selected',
          payload: { test: 'v2' },
        }),
        'http://localhost:3000'
      );
    });

    it('should accept any version number in endpoints', () => {
      const handler = vi.fn();
      ubidots.on('v999:custom:event', handler);

      ubidots.emit('v999:custom:event', { test: 'data' });
      expect(mockParent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'v999:custom:event',
          payload: { test: 'data' },
        }),
        'http://localhost:3000'
      );
    });

    it('should reject events without version prefix', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('devices:selected', { test: 'data' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid event format'),
          context: 'emit',
        })
      );
    });

    it('should reject events with invalid format', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('v:missing:number', { test: 'data' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid event format'),
          context: 'emit',
        })
      );
    });

    it('should support multi-level event names', () => {
      const handler = vi.fn();
      ubidots.on('v1:devices:settings:updated', handler);

      ubidots.emit('v1:devices:settings:updated', { test: 'data' });
      expect(mockParent.postMessage).toHaveBeenCalled();
    });
  });
});
