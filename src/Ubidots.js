/**
 * Create a listener to be able to listen to the Ubidots messages.
 * @class Ubidots
 */
class Ubidots {
  constructor() {
    this._eventsCallback = {
      selectedDevice: null,
      selectedDashboardDateRange: null,
      receivedToken: null,
      ready: null,
      isRealTimeActive: null,
      dashboardRefreshed: null,
      selectedDeviceObject: null,
      selectedDashboardObject: null,
    };

    window.addEventListener("message", this._listenMessage);
  }

  /**
   * Send a post Message
   * @param {Object}
   * @property {String} event - event name
   * @property {String} payload - event payload
   * @private
   * @memberOf Ubidots
   */
  _sendPostMessage({ event, payload }) {
    window.parent.postMessage(
      { event: event, payload: payload },
      window.location.origin
    );
  }

  /**
   * Set Dashboard Device
   * @param {String} deviceId - Device id
   * @memberOf Ubidots
   */
  setDashboardDevice(deviceId) {
    this._sendPostMessage({ event: "setDashboardDevice", payload: deviceId });
  }

  /**
   * Set Dashboard Data Range
   * @param {Object}
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   * @memberOf Ubidots
   */
  setDashboardDateRange(range) {
    this._sendPostMessage({
      event: "setDashboardDateRange",
      payload: range,
    });
  }

  /**
   * Set Realtime
   * @param {Boolean} enableRealTime
   * @memberOf Ubidots
   */
  setRealTime(enableRealTime) {
    this._sendPostMessage({ event: "setRealTime", payload: enableRealTime });
  }

  /**
   * Refresh the Dashboard
   * @memberOf Ubidots
   */
  refreshDashboard() {
    this._sendPostMessage({ event: "setDashboardDevice" });
  }

  /**
   * Returns the token of the user.
   * @returns {String} Token of the user.
   *
   * @memberOf Ubidots
   */
  get token() {
    return this._token;
  }

  /**
   * Set the token value
   * @param {String} token - token of the user
   *
   * @private
   * @memberOf Ubidots
   */
  _setToken = (token) => {
    this._token = token;
  };

  /**
   * Returns selected device in the dashboard
   * @returns {String} Id of the selected device
   * @memberOf Ubidots
   */
  get selectedDevice() {
    return this._selectedDevice;
  }

  /**
   * Set the device id value
   * @param {String} selectedDevice - The selected device id in the dashboard
   *
   * @private
   * @memberOf Ubidots
   */
  _setSelectedDevice = (selectedDevice) => {
    this._selectedDevice = selectedDevice;
  };

  /**
   * Returns selected date range in the dashboard
   * @returns {Object} Date range selected
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   *
   * @memberOf Ubidots
   */
  get dashboardDateRange() {
    return this._dashboardDateRange;
  }

  /**
   * Set the selected date range
   * @param {Object} dashboardDateRange - The selected date range in the dashboard
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   *
   * @private
   * @memberOf Ubidots
   */
  _setDashboardDateRange = (dashboardDateRange) => {
    this._dashboardDateRange = dashboardDateRange;
  };

  /**
   * Returns the realTime status.
   * @returns {Boolean} with realTime status.
   *
   * @memberOf Ubidots
   */
  get realTime() {
    return this._realTime;
  }

  /**
   * Set the realTime value
   * @param {Boolean} realTime
   *
   * @private
   * @memberOf Ubidots
   */
  _setRealTime = (realTime) => {
    this._realTime = realTime;
  };

  /**
   * Returns the deviceObject.
   * @returns {Object} deviceObject.
   *
   * @memberOf Ubidots
   */
  get deviceObject() {
    return this._deviceObject;
  }

  /**
   * Set the deviceObject value
   * @param {Object} deviceObject - deviceObject
   *
   * @private
   * @memberOf Ubidots
   */
  _setDeviceObject = (deviceObject) => {
    this._deviceObject = deviceObject;
  };
  /**
   * Returns the dashboardObject.
   * @returns {Object} dashboardObject.
   *
   * @memberOf Ubidots
   */
  get dashboardObject() {
    return this._dashboardObject;
  }

  /**
   * Set the dashboardObject value
   * @param {Object} dashboardObject - dashboardObject
   *
   * @private
   * @memberOf Ubidots
   */
  _setDashboardObject = (dashboardObject) => {
    this._dashboardObject = dashboardObject;
  };
  /**
   * Make a window listener event to receive dashboard messages
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   *
   * @memberOf Ubidots
   */
  on = (eventName, callback = undefined) => {
    if (Object.keys(this._eventsCallback).includes(eventName)) {
      this._eventsCallback[eventName] = callback;
    }
  };

  /**
   * Make a window listener event to receive dashboard messages and set data values to class attributes
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   *
   * @private
   * @memberOf Ubidots
   */
  _listenMessage = (event) => {
    if (
      event.origin !== window.location.origin ||
      !Object.keys(this._eventsCallback).includes(event.data.event)
    )
      return;

    const eventsData = {
      selectedDevice: this._setSelectedDevice,
      selectedDashboardDateRange: this._setDashboardDateRange,
      receivedToken: this._setToken,
      isRealTimeActive: this._setRealTime,
      selectedDeviceObject: this._setDeviceObject,
      selectedDashboardObject: this._setDashboardObject,
    };
    eventsData[event.data.event](event.data.payload);

    if (typeof this._eventsCallback[event.data.event] === "function") {
      this._eventsCallback[event.data.event](event.data.payload);
    }

    if (
      this._token !== undefined &&
      this._selectedDevice !== undefined &&
      this._dashboardDateRange !== undefined &&
      this._dashboardObject !== undefined &&
      typeof this._eventsCallback.ready === "function"
    ) {
      this._eventsCallback.ready();
      this._eventsCallback.ready = null;
    }
  };
}

export default Ubidots;
