import { Widget } from './Widget';
import { Ubidots as UJL } from '@ubidots/ubidots-javascript-library';

const EventsTypes = {
  IS_REALTIME_ACTIVE: 'isRealTimeActive',
  OPEN_DRAWER: 'openDrawer',
  RECEIVED_HEADERS: 'receivedHeaders',
  RECEIVED_JWT_TOKEN: 'receivedJWTToken',
  RECEIVED_TOKEN: 'receivedToken',
  REFRESH_DASHBOARD: 'refreshDashboard',
  SELECTED_DASHBOARD_DATE_RANGE: 'selectedDashboardDateRange',
  SELECTED_DASHBOARD_OBJECT: 'selectedDashboardObject',
  SELECTED_DEVICE_OBJECT: 'selectedDeviceObject',
  SELECTED_DEVICE_OBJECTS: 'selectedDeviceObjects',
  SELECTED_DEVICE: 'selectedDevice',
  SELECTED_DEVICES: 'selectedDevices',
  SELECTED_FILTERS: 'selectFilter',
  SET_DASHBOARD_DATE_RANGE: 'setDashboardDateRange',
  SET_DASHBOARD_DEVICE: 'setDashboardDevice',
  SET_DASHBOARD_LAYER: 'setDashboardLayer',
  SET_DASHBOARD_MULTIPLE_DEVICES: 'setDashboardMultipleDevices',
  SET_FULL_SCREEN: 'setFullScreen',
  SET_REAL_TIME: 'setRealTime',
};

/**
 * Create a listener to be able to listen to the Ubidots messages.
 * @class Ubidots
 */
class Ubidots {
  constructor() {
    this._eventsCallback = {
      dashboardRefreshed: null,
      isRealTimeActive: null,
      ready: null,
      receivedHeaders: null,
      receivedJWTToken: null,
      receivedToken: null,
      selectedDashboardDateRange: null,
      selectedDashboardObject: null,
      selectedDevice: null,
      selectedDeviceObject: null,
      selectedDevices: null,
      selectedDeviceObjects: null,
      selectedFilters: null,
    };
    this._headers = {};
    this.widget = new Widget(window.widgetId);
    this.api = UJL;
    window.addEventListener('message', this._listenMessage);
  }

  /**
   * Send a post Message
   * @param {Object}
   * @property {String} event - event name
   * @property {String} payload - event payload
   * @private
   * @memberOf Ubidots
   */
  // eslint-disable-next-line class-methods-use-this
  _sendPostMessage({ event, payload }) {
    window.parent.postMessage({ event: event, payload: payload }, window.location.origin);
  }

  /**
   * Set Dashboard Device
   * @param {String} deviceId - Numeric device id or API label (starting with ~)
   * @memberOf Ubidots
   */
  setDashboardDevice(deviceId) {
    this._sendPostMessage({ event: EventsTypes.SET_DASHBOARD_DEVICE, payload: deviceId });
  }

  /**
   * Set Multiple Dashboard Devices
   * @param {Array<String>} deviceIds - An array of device ids
   * @memberOf Ubidots
   */
  setDashboardMultipleDevices(deviceIds) {
    this._sendPostMessage({ event: EventsTypes.SET_DASHBOARD_MULTIPLE_DEVICES, payload: deviceIds });
  }

  /**
   * Set Dashboard Layer
   * @param {String} layerId - Layer id
   * @param {Object} [params] - Layer params
   * @memberOf Ubidots
   */
  setDashboardLayer(layerId, params = {}) {
    this._sendPostMessage({ event: EventsTypes.SET_DASHBOARD_LAYER, payload: { layerId, params } });
  }

  /**
   * Set Dashboard Data Range
   * @param {Object}
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   * @memberOf Ubidots
   */
  setDashboardDateRange(range) {
    this._sendPostMessage({ event: EventsTypes.SET_DASHBOARD_DATE_RANGE, payload: range });
  }

  /**
   * Set Realtime
   * @param {Boolean} enableRealTime
   * @memberOf Ubidots
   */
  setRealTime(enableRealTime) {
    this._sendPostMessage({ event: EventsTypes.SET_REAL_TIME, payload: enableRealTime });
  }

  /**
   * Refresh the Dashboard
   * @memberOf Ubidots
   */
  refreshDashboard() {
    this._sendPostMessage({ event: EventsTypes.REFRESH_DASHBOARD });
  }

  /**
   * Set FullScreen
   * @param {String} fullScreenAction
   * @memberOf Ubidots
   */
  setFullScreen(fullScreenAction) {
    this._sendPostMessage({ event: EventsTypes.SET_FULL_SCREEN, payload: fullScreenAction });
  }

  /**
   * Open Drawer
   * @param {Object} drawerInfo
   * @property {String} url - url to open in the drawer
   * @property {Number} width - drawer's width
   * @memberOf Ubidots
   */
  openDrawer(drawerInfo) {
    this._sendPostMessage({ event: EventsTypes.OPEN_DRAWER, payload: { drawerInfo, id: this.widget.getId() } });
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

  _setJWTToken = jwt => {
    this._jwtToken = jwt;
  };

  _setHeaders = (headers = {}) => {
    this._headers = headers;
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
   * Gets the selected devices.
   *
   * @returns {Array} The selected devices.
   */
  get selectedDevices() {
    return this._selectedDevices;
  }

  getHeaders() {
    const headers = {
      ...this._headers,
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['X-Auth-Token'] = this.token;
    } else if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    return headers;
  }

  get jwtToken() {
    return this._jwtToken;
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
   * Sets the selected devices.
   *
   * @param {Array} deviceIdsArray - An array of device IDs.
   */
  _setSelectedDevices = deviceIdsArray => {
    this._selectedDevices = deviceIdsArray;
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
  _setRealTime = realTime => {
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
  _setDeviceObject = deviceObject => {
    this._deviceObject = deviceObject;
  };

  /**
   * Get the selected device objects.
   * @returns {Array} The selected device objects.
   */
  get selectedDeviceObjects() {
    return this._selectedDeviceObjects;
  }

  /**
   * Sets the selected device objects.
   *
   * @param {Array} selectedDeviceObjectsList - The list of selected device objects.
   */
  _setSelectedDeviceObjects = selectedDeviceObjectsList => {
    this._selectedDeviceObjects = selectedDeviceObjectsList;
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
  _setDashboardObject = dashboardObject => {
    this._dashboardObject = dashboardObject;
  };

  /**
   * Get the selected filters.
   *
   * @returns {Array} The selected filters.
   */
  get selectedFilters() {
    return this._selectedFilters;
  }

  /**
   * Sets the selected filters for the Ubidots class.
   *
   * @param {Array} selectedFilters - The selected filters to be set.
   */
  _setSelectedFilters = selectedFilters => {
    this._selectedFilters = selectedFilters;
  };
  /**
   * Make a window listener event to receive dashboard messages
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   *
   * @memberOf Ubidots
   */
  on = (eventName, callback) => {
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
    if (event.origin !== window.location.origin) return;
    const { event: eventName, payload } = event.data;

    const eventHandlers = {
      [EventsTypes.IS_REALTIME_ACTIVE]: this._setRealTime,
      [EventsTypes.RECEIVED_HEADERS]: this._setHeaders,
      [EventsTypes.RECEIVED_JWT_TOKEN]: this._setJWTToken,
      [EventsTypes.RECEIVED_TOKEN]: this._setToken,
      [EventsTypes.SELECTED_DASHBOARD_DATE_RANGE]: this._setDashboardDateRange,
      [EventsTypes.SELECTED_DASHBOARD_OBJECT]: this._setDashboardObject,
      [EventsTypes.SELECTED_DEVICE]: this._setSelectedDevice,
      [EventsTypes.SELECTED_DEVICE_OBJECT]: this._setDeviceObject,
      [EventsTypes.SELECTED_DEVICES]: this._setSelectedDevices,
      [EventsTypes.SELECTED_DEVICE_OBJECTS]: this._setSelectedDeviceObjects,
      [EventsTypes.SELECTED_FILTERS]: this._setSelectedFilters,
    };

    const handler = eventHandlers[eventName];
    if (handler) handler(payload);

    if (typeof this._eventsCallback[event.data.event] === 'function') {
      this._eventsCallback[event.data.event](event.data.payload);
    }

    if (
      (this._token || this._jwtToken) &&
      this._selectedDevice !== undefined &&
      this._dashboardDateRange !== undefined &&
      this._dashboardObject !== undefined &&
      typeof this._eventsCallback.ready === 'function'
    ) {
      this._eventsCallback.ready();
      this._eventsCallback.ready = null;
    }
  };
}

export default Ubidots;
