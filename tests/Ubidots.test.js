import sinon from "sinon";
import expect from "expect.js";
import Ubidots from "../src/Ubidots";

describe("Array", () => {
  const lastWindow = window;
  const setUp = () => {
    const ubidots = new Ubidots();

    return ubidots;
  };

  afterEach(() => {
    global.window = lastWindow;
    sinon.reset();
    sinon.restore();
  });

  describe("#instance", () => {
    it("should be defined", () => {
      const obj = setUp();
      expect(obj).to.be.a(Ubidots);
    });

    it("should becall to window addEventListener", () => {
      const spy = sinon.spy(window, "addEventListener");
      setUp();
      expect(spy.called).to.be.ok();
    });
  });

  describe("#token", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.token).to.be(undefined);
    });

    it("should be token-test-fdghjkj24y35oi45tf6g45hvbjhk", () => {
      const obj = setUp();

      const token = "token-test-fdghjkj24y35oi45tf6g45hvbjhk";
      obj._setToken(token);

      expect(obj.token).to.be(token);
    });
  });

  describe("#selectedDevice", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.selectedDevice).to.be(undefined);
    });

    it("should be fdghjkj24y35oi45tf6g45hvbjhk", () => {
      const obj = setUp();

      const selectedDevice = "fdghjkj24y35oi45tf6g45hvbjhk";
      obj._setSelectedDevice(selectedDevice);

      expect(obj.selectedDevice).to.be(selectedDevice);
    });
  });

  describe("#dashboardDateRange", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it("should be and object", () => {
      const obj = setUp();

      const dashboardDateRange = { start: 2345678904567, end: 2345678934567 };
      obj._setDashboardDateRange(dashboardDateRange);

      expect(typeof obj.dashboardDateRange).to.be("object");
      expect(obj.dashboardDateRange.start).to.be(dashboardDateRange.start);
      expect(obj.dashboardDateRange.end).to.be(dashboardDateRange.end);
    });
  });

  describe("#on", () => {
    it("should update the event callback", () => {
      const obj = setUp();

      obj.on("selectedDevice", () => null);

      expect(typeof obj._eventsCallback.selectedDevice).to.be("function");
    });

    it("Shouldn't update any event callback object key", () => {
      const obj = setUp();

      obj.on("fakeEvent", () => null);

      expect(obj._eventsCallback.receivedToken).to.be(null);
      expect(obj._eventsCallback.selectedDevice).to.be(null);
      expect(obj._eventsCallback.selectedDashboardDateRange).to.be(null);
    });
  });

  describe("#_listenMessage", () => {
    it("should not update any data because the origin does not match", () => {
      const obj = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const event = {
        origin: "http://127.0.0.2",
        data: {
          event: "receivedToken",
          payload: "test-token-4567d89fdg0h8bf5vc4567vd9f80gj",
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be(undefined);
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it("should not update any data because the event does not match", () => {
      const obj = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "fakeEvent",
          payload: "test-token-4567d89fdg0h8bf5vc4567vd9f80gj",
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be(undefined);
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it("should update only the token value", () => {
      const obj = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: "test-token-4567d89fdg0h8bf5vc4567vd9f80gj",
        },
      };
      obj._listenMessage(event);

      expect(obj.token).to.be("test-token-4567d89fdg0h8bf5vc4567vd9f80gj");
      expect(obj.selectedDevice).to.be(undefined);
      expect(obj.dashboardDateRange).to.be(undefined);
    });

    it("should update only the token value and call the callback function", () => {
      const obj = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const spy = sinon.spy();
      obj.on("receivedToken", spy);

      const token = "test-token-4567d89fdg0h8bf5vc4567vd9f80gj";
      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: token,
        },
      };
      obj._listenMessage(event);

      expect(spy.called).to.be.ok();
      expect(spy.calledWithExactly(token)).to.be.ok();
      expect(obj.token).to.be(token);
    });

    it("should update the dashboard date range value and doesn't call any callback function", () => {
      const obj = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const spy = sinon.spy();

      const selectedDashboardDateRange = {
        start: 908745678908756,
        end: 5678909876456,
      };
      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "selectedDashboardDateRange",
          payload: selectedDashboardDateRange,
        },
      };
      obj._listenMessage(event);

      expect(spy.notCalled).to.be.ok();
      expect(obj.dashboardDateRange).to.be(selectedDashboardDateRange);
    });

    it("should not execute the ready event if the previous values are not yet set", () => {
      const ubidots = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const spy = sinon.spy();
      ubidots.on("ready", spy);

      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: "test-token",
        },
      };
      ubidots._listenMessage(event);

      expect(spy.notCalled).to.be.ok();
    });

    it("should execute the ready event if the previous values are set", () => {
      const ubidots = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const spy = sinon.spy();
      ubidots.on("ready", spy);

      ubidots._token = "prefilled-token";
      ubidots._selectedDevice = "prefilled-device";
      ubidots._dashboardDateRange = "prefilled-date";
      ubidots._dashboardObject = { name: "name device", label: "device-label" };

      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: "test-token",
        },
      };
      ubidots._listenMessage(event);

      expect(spy.called).to.be.ok();
    });

    it("should execute the ready event only once in the lifetime", () => {
      const ubidots = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };

      const spy = sinon.spy();
      ubidots.on("ready", spy);

      ubidots._token = "prefilled-token";
      ubidots._selectedDevice = "prefilled-device";
      ubidots._dashboardDateRange = "prefilled-date";
      ubidots._dashboardObject = { name: "name device", label: "device-label" };

      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: "test-token",
        },
      };

      for (let i = 0; i < 50; i++) {
        ubidots._listenMessage(event);
      }

      expect(spy.calledOnce).to.be.ok();
    });

    it("should update the headers property", () => {
      const ubidots = setUp();
      global.window = { location: { origin: "http://127.0.0.1" } };
      const today = new Date().toISOString();
      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedHeaders",
          payload: { Date: today },
        },
      };

      ubidots._listenMessage(event);

      expect(ubidots.getHeaders()).eql({
        "Content-Type": "application/json",
        Date: today,
      });
    });
  });

  describe("#getHeaders", () => {
    it("should return an object by default", () => {
      const ubidots = setUp();
      expect(ubidots.getHeaders()).eql({
        "Content-Type": "application/json",
      });
    });

    it("should return the 'X-Auth-Token' with the token that was sended", () => {
      global.window = {
        location: { origin: "http://127.0.0.1" },
        addEventListener: sinon.spy(),
      };

      const ubidots = setUp();
      const token = "test-token";
      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedToken",
          payload: token,
        },
      };
      ubidots._listenMessage(event);

      expect(ubidots.getHeaders()).eql({
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      });
    });

    it("should return the 'Authorization' with the JWT that was sended", () => {
      global.window = {
        location: { origin: "http://127.0.0.1" },
        addEventListener: sinon.spy(),
      };

      const ubidots = setUp();
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidWJpZG90cyJ9.tDp2hPvOhCzvk1Wf1wjUMaocGkZq-tHQptxfKH4Drow";
      const event = {
        origin: "http://127.0.0.1",
        data: {
          event: "receivedJWTToken",
          payload: token,
        },
      };
      ubidots._listenMessage(event);

      expect(ubidots.getHeaders()).eql({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });
    });
  });

  describe("#realTime", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.realTime).to.be(undefined);
    });

    it("should be true", () => {
      const obj = setUp();

      obj._setRealTime(true);

      expect(obj.realTime).to.be(true);
    });

    it("should be false", () => {
      const obj = setUp();

      obj._setRealTime(false);

      expect(obj.realTime).to.be(false);
    });
  });

  describe("#deviceObject", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.deviceObject).to.be(undefined);
    });

    it("should be object ", () => {
      const obj = setUp();

      const deviceObject = { name: "device name", label: "device-label" };
      obj._setDeviceObject(deviceObject);

      expect(obj.deviceObject).to.be(deviceObject);
    });
  });

  describe("#dashboardObject", () => {
    it("should be undefined", () => {
      const obj = setUp();
      expect(obj.selectedDevice).to.be(undefined);
    });

    it("should be object", () => {
      const obj = setUp();

      const dashboardObject = {
        name: "dashboard name",
        label: "dashboard-label",
      };
      obj._setDashboardObject(dashboardObject);

      expect(obj.dashboardObject).to.be(dashboardObject);
    });
  });

  describe('Widget',()=>{
    it('Should create the widget with default settings when no plugin variable defined in the window', () => {
      const ubidots = new Ubidots();

      const widget = ubidots.getWidget();

      expect(widget).empty();
    });

    it('Should create the widget with default settings when no plugin variable defined in the window', () => {
      window._pluginWidgetSettings = {
        keyTest: 'Test',
      };

      const ubidots = new Ubidots();

      const widget = ubidots.getWidget();
      console.log('widget :', widget);
      expect(widget.getSettings().keyTest).to.equal('Test');
    })
  })
});
