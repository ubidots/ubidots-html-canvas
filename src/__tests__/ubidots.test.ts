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

  describe('Constructor and Version Validation', () => {
    it('should create instance with default version v1', () => {
      ubidots = new Ubidots();
      expect(ubidots).toBeInstanceOf(Ubidots);
    });

    it('should create instance with v2 version', () => {
      ubidots = new Ubidots('v2');
      expect(ubidots).toBeInstanceOf(Ubidots);
    });

    it('should throw error for invalid version', () => {
      expect(() => {
        new Ubidots('v3');
      }).toThrow('Unsupported API version: v3. Supported versions: v1, v2');
    });

    it('should throw error for empty string version', () => {
      expect(() => {
        new Ubidots('');
      }).toThrow('Unsupported API version: . Supported versions: v1, v2');
    });
  });

  describe('Ready Event', () => {
    it('should emit ready event after initialization', async () => {
      ubidots = new Ubidots('v1');

      return new Promise<void>(resolve => {
        ubidots.on('ready', data => {
          expect(data).toEqual({
            version: 'v1',
            timestamp: expect.any(Number),
          });
          expect(data.timestamp).toBeGreaterThan(Date.now() - 100);
          resolve();
        });
      });
    });

    it('should emit ready event with correct version for v2', async () => {
      ubidots = new Ubidots('v2');

      return new Promise<void>(resolve => {
        ubidots.on('ready', data => {
          expect(data.version).toBe('v2');
          resolve();
        });
      });
    });
  });

  describe('Event Emission and Communication', () => {
    beforeEach(() => {
      ubidots = new Ubidots('v1');
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
      ubidots = new Ubidots('v1');
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
      ubidots = new Ubidots('v1');
    });

    it('should reject unsupported endpoints for on()', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      const unsubscribe = ubidots.on('v1:unsupported:endpoint', vi.fn());

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unsupported event endpoint: v1:unsupported:endpoint',
          context: 'on',
        })
      );

      // Should return safe unsubscribe function
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).not.toThrow();
    });

    it('should reject unsupported endpoints for emit()', () => {
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('v1:unsupported:endpoint', { test: 'data' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unsupported event endpoint: v1:unsupported:endpoint',
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
      ubidots = new Ubidots('v1');
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
      ubidots = new Ubidots('v1');
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
      ubidots = new Ubidots('v1');
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

      ubidots.emit('v1:unsupported', {});

      expect(errorHandler).toHaveBeenCalledWith({
        message: 'Unsupported event endpoint: v1:unsupported',
        name: 'Error',
        stack: expect.any(String),
        context: 'emit',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Destroy Method', () => {
    beforeEach(() => {
      ubidots = new Ubidots('v1');
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

  describe('Version-Specific Endpoints', () => {
    it('should handle v1 endpoints correctly', () => {
      ubidots = new Ubidots('v1');
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

    it('should handle v2 endpoints correctly', () => {
      ubidots = new Ubidots('v2');
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

    it('should reject wrong version endpoints', () => {
      ubidots = new Ubidots('v1');
      const errorHandler = vi.fn();
      ubidots.on('error', errorHandler);

      ubidots.emit('v2:devices:selected', { test: 'data' });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unsupported event endpoint: v2:devices:selected',
          context: 'emit',
        })
      );
    });
  });
});
