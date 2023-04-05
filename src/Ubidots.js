import { Widget } from './Widget';

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
    };

    this.widget = new Widget();

    window.addEventListener('message', this._listenMessage);
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
   * Insert the widget sepecific settings from the Plugin Widget
   *
   */
  getWidget() {
    return this.widget;
  }

  /**
   * Returns the header object
   */
  get getHeader() {
    const headers = {
      'Content-type': 'application/json',
    };

    if (this._jwttoken) {
      headers['Authorization'] = `Bearer ${this._jwttoken}`;
      return headers;
    }

    if (this._token) {
      headers['X-Auth-Token'] = this._token;
    }

    return headers;
  }

  /**
   * Set the token value
   * @param {String} token - token of the user
   *
   * @private
   * @memberOf Ubidots
   */
  _setToken = token => {
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
  _setSelectedDevice = selectedDevice => {
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
  _setDashboardDateRange = dashboardDateRange => {
    this._dashboardDateRange = dashboardDateRange;
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
  _listenMessage = event => {
    if (event.origin !== window.location.origin || !Object.keys(this._eventsCallback).includes(event.data.event))
      return;

    const eventsData = {
      selectedDevice: this._setSelectedDevice,
      selectedDashboardDateRange: this._setDashboardDateRange,
      receivedToken: this._setToken,
    };
    eventsData[event.data.event](event.data.payload);

    if (typeof this._eventsCallback[event.data.event] === 'function') {
      this._eventsCallback[event.data.event](event.data.payload);
    }

    if (
      this._token !== undefined &&
      this._selectedDevice !== undefined &&
      this._dashboardDateRange !== undefined &&
      typeof this._eventsCallback.ready === 'function'
    ) {
      this._eventsCallback.ready();
      this._eventsCallback.ready = null;
    }
  };
}

export default Ubidots;
