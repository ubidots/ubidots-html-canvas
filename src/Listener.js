/**
 * Create a listener to be able to listen to the Ubidots messages.
 * @class Listener
 * @param {String} eventName - Name of the event you want to listen to ()
 */
class Listener {
  constructor(eventName) {
    this.token = undefined;
    this.device = undefined;
    this.dashboardDateRange = undefined;

    this._listener = null;
    this._eventName = eventName;
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
   * @param {String} [token=undefined] - token of the user
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
   * @param {Function} [callback] - Function to execute when be listen to the message
   * 
   * @memberOf Listener
   */
  on(callback = undefined) {
    this._listenMessage(eventName, callback);
  }

  /**
   * Make a window listener event to receive dashboard messages and set data values to class attributes
   * @param {Function} [callback] - Function to execute when be listen to the message
   * 
   * @private
   * @memberOf Listener
   */
  _listenMessage(callback = undefined) {
    if (this._listener) return;

    this._listener = window.addEventListener('message', (data) => {
      if (data.event !== this._eventName) return;

      if (typeof callback === 'function') {
        callback(data);
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
