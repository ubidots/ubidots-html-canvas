/**
 * Create a listener to be able to listen to the Ubidots messages.
 * @class Listener
 */
class Listener {
  constructor() {
    this._listener = null;
    this._eventsCallback = {
      selectedDevice: null,
      selectedDashboardDateRange: null,
      receivedToken: null,
    };

    this._listenMessage();
  }

  /**
   * Returns the token of the user.
   * @returns {String} Token of the user.
   * 
   * @memberOf Listener
   */
  getToken() {
    return this.token;
  }

  /**
   * Set the token value
   * @param {String} token - token of the user
   * 
   * @private
   * @memberOf Listener
   */
  _setToken(token = undefined) {
    this.token = token;
  }

  /**
   * Returns selected device in the dashboard
   * @returns {String} Id of the selected device
   * @memberOf Listener
   */
  getSelectedDevice() {
    return this.devices;
  }

  /**
   * Set the device id value
   * @param {String} [device=undefined] - The selected device id in the dashboard
   * 
   * @private
   * @memberOf Listener
   */
  _setSelectedDevice(device = undefined) {
    this.devices = devices;
  }

  /**
   * Returns selected date range in the dashboard
   * @returns {Object} Date range selected
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   * 
   * @memberOf Listener
   */
  getDashboardDateRange() {
    return this.dashboardDateRange;
  }

  /**
   * Set the selected date range
   * @param {Object} [dashboardDateRange=undefined] - The selected date range in the dashboard
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   * 
   * @private
   * @memberOf Listener
   */
  _setDashboardDateRange(dashboardDateRange = undefined) {
    this.dashboardDateRange = dashboardDateRange;
  }

  /**
   * Make a window listener event to receive dashboard messages
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   * 
   * @memberOf Listener
   */
  on(eventName, callback = undefined) {
    if (Object.keys(this._eventsCallback).includes(eventName)) {
      this._eventsCallback[eventName] = callback;
    }
  }

  /**
   * Make a window listener event to receive dashboard messages and set data values to class attributes
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   * 
   * @private
   * @memberOf Listener
   */
  _listenMessage() {
    if (this._listener) return;

    this._listener = window.addEventListener('message', (data) => {
      if (this._eventsCallback[data.type] !== null) {
        this._eventsCallback[data.type](data.payload)
      }

      const eventsData = {
        selectedDevice: this._setSelectedDevice,
        selectedDashboardDateRange: this._setDashboardDateRange,
        receivedToken: this._setToken,
      };

      eventsData[data.type](data.payload);
    }, );
  }
}

export default Listener;
