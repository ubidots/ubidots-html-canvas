import sinon from 'sinon';
import expect from 'expect.js';
import Ubidots from '../src/Ubidots';

describe('Array', () => {
  const lastWindow = window;
  const setUp = () => {
    const ubidots = new Ubidots();

    return ubidots;
  }

  afterEach(() => {
    global.window = lastWindow;
    sinon.reset();
    sinon.restore();
  });

  describe('#instance', () => {
    it('should be defined', () => {
      const obj = setUp();
      expect(obj).to.be.a(Ubidots);
    });

    it('should becall to window addEventListener', () => {
      const spy = sinon.spy(window, 'addEventListener');
      setUp();
      expect(spy.called).to.be.ok();
    });
  });

  describe('#token', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.token).to.be(undefined);
    });

    it('should be token-test-fdghjkj24y35oi45tf6g45hvbjhk', () => {
      const obj = setUp();

      const token = 'token-test-fdghjkj24y35oi45tf6g45hvbjhk';
      obj._setToken(token)

      expect(obj.token).to.be(token);
    });
  });

  describe('#selectedDevice', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.selectedDevice).to.be(undefined);
    });

    it('should be fdghjkj24y35oi45tf6g45hvbjhk', () => {
      const obj = setUp();

      const selectedDevice = 'fdghjkj24y35oi45tf6g45hvbjhk';
      obj._setSelectedDevice(selectedDevice)

      expect(obj.selectedDevice).to.be(selectedDevice);
    });
  });

  describe('#dashboardDateRange', () => {
    it('should be undefined', () => {
      const obj = setUp();
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it('should be and object', () => {
      const obj = setUp();

      const dashboardDateRange = { start: 2345678904567, end: 2345678934567 };
      obj._setDashboardDateRange(dashboardDateRange)

      expect(typeof obj.dashboardDateRange).to.be('object');
      expect(obj.dashboardDateRange.start).to.be(dashboardDateRange.start);
      expect(obj.dashboardDateRange.end).to.be(dashboardDateRange.end);
    });
  });

  describe('#on', () => {
    it('should update the event callback', () => {
      const obj = setUp();

      obj.on('selectedDevice', () => null);

      expect(typeof obj._eventsCallback.selectedDevice).to.be('function')
    });

    it('Shouldn\'t update any event callback object key', () => {
      const obj = setUp();

      obj.on('fakeEvent', () => null);

      expect(obj._eventsCallback.receivedToken).to.be(null)
      expect(obj._eventsCallback.selectedDevice).to.be(null)
      expect(obj._eventsCallback.selectedDashboardDateRange).to.be(null)
    });
  });

  describe('#_listenMessage', () => {
    it('should not update any data because the origin does not match', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const event = {
        origin: 'http://127.0.0.2',
        data: {
          event: 'receivedToken',
          payload: 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj',
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be(undefined);
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it('should not update any data because the event does not match', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'fakeEvent',
          payload: 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj',
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be(undefined);
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it('should update only the token value', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj',
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be('test-token-4567d89fdg0h8bf5vc4567vd9f80gj');
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it('should update only the token value and call the callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = sinon.spy();
      obj.on('receivedToken', spy);

      const token = 'test-token-4567d89fdg0h8bf5vc4567vd9f80gj';
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'receivedToken',
          payload: token,
        },
      };
      obj._listenMessage(event);

      expect(spy.called).to.be.ok();
      expect(spy.calledWithExactly(token)).to.be.ok();
      expect(obj.token).to.be(token);
    });

    it('should update the dashboard date range value and doesn\'t call any callback function', () => {
      const obj = setUp();
      global.window = { location: { origin: 'http://127.0.0.1' } };

      const spy = sinon.spy();

      const selectedDashboardDateRange = { start: 908745678908756, end: 5678909876456 };
      const event = {
        origin: 'http://127.0.0.1',
        data: {
          event: 'selectedDashboardDateRange',
          payload: selectedDashboardDateRange,
        },
      };
      obj._listenMessage(event);

      expect(spy.notCalled).to.be.ok();
      expect(obj.dashboardDateRange).to.be(selectedDashboardDateRange);
    });
  });
});
