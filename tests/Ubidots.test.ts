import { describe, it, expect, afterEach, vi } from 'vitest';
import Ubidots from '../src/Ubidots';
import type { DashboardDateRange, Headers, PostMessageData } from '../src/types';

describe('Ubidots', () => {
  const lastWindow = window;
  const setUp = (): Ubidots => {
    const ubidots = new Ubidots();
    return ubidots;
  };

  afterEach(() => {
    global.window = lastWindow;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('#instance', () => {
    it('should be defined', () => {
      const obj = setUp();
      expect(obj).toBeInstanceOf(Ubidots);
    });

    it('should call window addEventListener', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      setUp();
      expect(spy).toHaveBeenCalled();
    });

    it('should have an eventBus instance', () => {
      const obj = setUp();
      expect(obj.eventBus).toBeTypeOf('object');
      expect(obj.eventBus.subscribe).toBeTypeOf('function');
      expect(obj.eventBus.publish).toBeTypeOf('function');
    });

    it('should have simplified API methods', () => {
      const obj = setUp();
      expect(obj.listen).toBeTypeOf('function');
      expect(obj.emit).toBeTypeOf('function');
      expect(obj.postMessage).toBeTypeOf('function');
    });
  });

  describe('#token', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.token).toBeUndefined();
    });

    it('should be token-test-fdghjkj24y35oi45tf6g45hvbjhk', () => {
      const obj = setUp();

      const token = 'token-test-fdghjkj24y35oi45tf6g45hvbjhk';
      obj._setToken(token);

      expect(obj.token).toBe(token);
    });
  });

  describe('#selectedDevice', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.selectedDevice).toBeUndefined();
    });

    it('should be fdghjkj24y35oi45tf6g45hvbjhk', () => {
      const obj = setUp();

      const selectedDevice = 'fdghjkj24y35oi45tf6g45hvbjhk';
      obj._setSelectedDevice(selectedDevice);

      expect(obj.selectedDevice).toBe(selectedDevice);
    });
  });

  describe('#selectedDevices', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.selectedDevices).toBeUndefined();
    });

    it('should be an array of device IDs', () => {
      const obj = setUp();

      const selectedDevices = ['fdghjkj24y35oi45tf6g45hvbjhk', 'device2Id', 'device3Id'];
      obj._setSelectedDevices(selectedDevices);
      expect(obj.selectedDevices).toBe(selectedDevices);
    });
  });

  describe('#selectedFilters', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.selectedFilters).toBeUndefined();
    });

    it('should be an array of filter objects', () => {
      const obj = setUp();

      const selectedFilters = [{ key: 'status', value: 'active', operator: 'eq' }];
      obj._setSelectedFilters(selectedFilters);

      expect(obj.selectedFilters).toBe(selectedFilters);
    });
  });

  describe('#dashboardDateRange', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.dashboardDateRange).toBeUndefined();
    });

    it('should be an object with start and end', () => {
      const obj = setUp();

      const dashboardDateRange: DashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      obj._setDashboardDateRange(dashboardDateRange);

      expect(obj.dashboardDateRange).toBe(dashboardDateRange);
    });
  });

  describe('#_handleMessage', () => {
    it('should update only the token value and not call any callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj',
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(obj.token).toBe('test-token-4567d89fdg0h8bf5vc4567vd9f80gj');
      expect(obj.selectedDevice).toBeUndefined();
      expect(obj.dashboardDateRange).toBeUndefined();
    });

    it('should update only the token value and call the callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const spy = vi.fn();
      obj.on('receivedToken', spy);

      const token = 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj';
      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(token);
      expect(obj.token).toBe(token);
    });

    it('should support multiple callbacks for the same event using eventBus', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const spy1 = vi.fn();
      const spy2 = vi.fn();
      obj.on('receivedToken', spy1);
      obj.on('receivedToken', spy2);

      const token = 'test-token-multi';
      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy1).toHaveBeenCalledWith(token);
      expect(spy2).toHaveBeenCalledWith(token);
    });

    it('should work with listen() method', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const spy = vi.fn();
      obj.listen('receivedToken', spy);

      const token = 'test-token-listen';
      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(token);
    });

    it('should emit events with emit() method', () => {
      const obj = setUp();

      const spy = vi.fn();
      obj.listen('customEvent', spy);

      obj.emit('customEvent', 'test-data');

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('test-data');
    });

    it('should update the dashboard date range value and not call any callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const selectedDashboardDateRange: DashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'selectedDashboardDateRange',
          payload: selectedDashboardDateRange,
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(obj.dashboardDateRange).toBe(selectedDashboardDateRange);
      expect(obj.token).toBeUndefined();
      expect(obj.selectedDevice).toBeUndefined();
    });

    it('should update the dashboard date range value and call the callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const spy = vi.fn();
      obj.on('selectedDashboardDateRange', spy);

      const selectedDashboardDateRange: DashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      const event: MessageEvent<PostMessageData> = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'selectedDashboardDateRange',
          payload: selectedDashboardDateRange,
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(selectedDashboardDateRange);
      expect(obj.dashboardDateRange).toBe(selectedDashboardDateRange);
    });

    it('should not process messages from different origins', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } } as Window & typeof globalThis;

      const spy = vi.fn();
      obj.on('receivedToken', spy);

      const event: MessageEvent<PostMessageData> = {
        origin: 'http://malicious-site.com',
        data: {
          event: 'receivedToken',
          payload: 'malicious-token',
        },
      } as MessageEvent<PostMessageData>;
      obj._handleMessage(event);

      expect(spy).not.toHaveBeenCalled();
      expect(obj.token).toBeUndefined();
    });
  });

  describe('#postMessage', () => {
    it('should call window.parent.postMessage and emit event locally', () => {
      const obj = setUp();
      const postMessageSpy = vi.fn();
      global.window.parent = { postMessage: postMessageSpy } as Window;

      const localSpy = vi.fn();
      obj.on('testEvent', localSpy);

      obj.postMessage('testEvent', 'testPayload');

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'testEvent', payload: 'testPayload' },
        window.location.origin
      );
      expect(localSpy).toHaveBeenCalledWith('testPayload');
    });
  });

  describe('#getHeaders', () => {
    it('should return headers with token', () => {
      const obj = setUp();
      obj._setToken('test-token');

      const headers = obj.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Auth-Token': 'test-token',
      });
    });

    it('should return headers with JWT token', () => {
      const obj = setUp();
      obj._setJWTToken('jwt-token');

      const headers = obj.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jwt-token',
      });
    });

    it('should prioritize regular token over JWT token', () => {
      const obj = setUp();
      obj._setToken('regular-token');
      obj._setJWTToken('jwt-token');

      const headers = obj.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-Auth-Token': 'regular-token',
      });
    });

    it('should include custom headers', () => {
      const obj = setUp();
      const customHeaders = { 'Custom-Header': 'custom-value' };
      obj._setHeaders(customHeaders);
      obj._setToken('test-token');

      const headers = obj.getHeaders();

      expect(headers).toEqual({
        'Custom-Header': 'custom-value',
        'Content-Type': 'application/json',
        'X-Auth-Token': 'test-token',
      });
    });
  });

  describe('#dashboard methods', () => {
    it('should call postMessage for setDashboardDevice', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');

      obj.setDashboardDevice('device-123');

      expect(spy).toHaveBeenCalledWith('setDashboardDevice', 'device-123');
    });

    it('should call postMessage for setDashboardMultipleDevices', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');
      const deviceIds = ['device-1', 'device-2'];

      obj.setDashboardMultipleDevices(deviceIds);

      expect(spy).toHaveBeenCalledWith('setDashboardMultipleDevices', deviceIds);
    });

    it('should call postMessage for setDashboardDateRange', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');
      const range: DashboardDateRange = { start: 123, end: 456 };

      obj.setDashboardDateRange(range);

      expect(spy).toHaveBeenCalledWith('setDashboardDateRange', range);
    });

    it('should call postMessage for setRealTime', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');

      obj.setRealTime(true);

      expect(spy).toHaveBeenCalledWith('setRealTime', true);
    });

    it('should call postMessage for refreshDashboard', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');

      obj.refreshDashboard();

      expect(spy).toHaveBeenCalledWith('refreshDashboard');
    });

    it('should call postMessage for openDrawer', () => {
      const obj = setUp();
      const spy = vi.spyOn(obj, 'postMessage');
      const drawerInfo = { url: 'https://example.com', width: 400 };

      obj.openDrawer(drawerInfo);

      expect(spy).toHaveBeenCalledWith('openDrawer', {
        drawerInfo,
        id: obj.widget.getId()
      });
    });
  });

  describe('#widget integration', () => {
    it('should return widget instance', () => {
      const obj = setUp();
      const widget = obj.getWidget();

      expect(widget).toBeDefined();
      expect(widget.getSettings).toBeTypeOf('function');
      expect(widget.getId).toBeTypeOf('function');
    });
  });

  describe('#off method', () => {
    it('should unsubscribe callback from event', () => {
      const obj = setUp();
      const callback = vi.fn();

      obj.on('testEvent', callback);
      obj.emit('testEvent', 'data');
      expect(callback).toHaveBeenCalledTimes(1);

      obj.off('testEvent', callback);
      obj.emit('testEvent', 'data');
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});