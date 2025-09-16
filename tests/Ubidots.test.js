import { describe, it, expect, afterEach, vi } from 'vitest';
import Ubidots from '../src/Ubidots';

describe('Ubidots', () => {
  const lastWindow = window;
  const setUp = () => {
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

    it('should be an object', () => {
      const obj = setUp();

      const selectedFilters = { key: 'value' };
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

      const dashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      obj._setDashboardDateRange(dashboardDateRange);

      expect(obj.dashboardDateRange).toBe(dashboardDateRange);
    });
  });

  describe('#_listenMessage', () => {
    it('should update only the token value and not call any callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj',
        },
      };
      obj._handleMessage(event);

      expect(obj.token).toBe('test-token-4567d89fdg0h8bf5vc4567vd9f80gj');
      expect(obj.selectedDevice).toBeUndefined();
      expect(obj.dashboardDateRange).toBeUndefined();
    });

    it('should update only the token value and call the callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = vi.fn();
      obj.on('receivedToken', spy);

      const token = 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj';
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      };
      obj._handleMessage(event);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(token);
      expect(obj.token).toBe(token);
    });

    it('should support multiple callbacks for the same event using eventBus', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy1 = vi.fn();
      const spy2 = vi.fn();
      obj.on('receivedToken', spy1);
      obj.on('receivedToken', spy2);

      const token = 'test-token-multi';
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      };
      obj._handleMessage(event);

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy1).toHaveBeenCalledWith(token);
      expect(spy2).toHaveBeenCalledWith(token);
    });

    it('should work with listen() method', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = vi.fn();
      obj.listen('receivedToken', spy);

      const token = 'test-token-listen';
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      };
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
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const selectedDashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'selectedDashboardDateRange',
          payload: selectedDashboardDateRange,
        },
      };
      obj._handleMessage(event);

      expect(obj.dashboardDateRange).toBe(selectedDashboardDateRange);
      expect(obj.token).toBeUndefined();
      expect(obj.selectedDevice).toBeUndefined();
    });

    it('should update the dashboard date range value and call the callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = vi.fn();
      obj.on('selectedDashboardDateRange', spy);

      const selectedDashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'selectedDashboardDateRange',
          payload: selectedDashboardDateRange,
        },
      };
      obj._handleMessage(event);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(selectedDashboardDateRange);
      expect(obj.dashboardDateRange).toBe(selectedDashboardDateRange);
    });

    it('should not process messages from different origins', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = vi.fn();
      obj.on('receivedToken', spy);

      const event = {
        origin: 'http://malicious-site.com',
        data: {
          event: 'receivedToken',
          payload: 'malicious-token',
        },
      };
      obj._handleMessage(event);

      expect(spy).not.toHaveBeenCalled();
      expect(obj.token).toBeUndefined();
    });
  });

  describe('#postMessage', () => {
    it('should call window.parent.postMessage and emit event locally', () => {
      const obj = setUp();
      const postMessageSpy = vi.fn();
      global.window.parent = { postMessage: postMessageSpy };

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
  });
});