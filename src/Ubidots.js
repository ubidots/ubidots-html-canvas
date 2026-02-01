import { Widget } from './Widget';
import { Ubidots as UJL } from '@ubidots/ubidots-javascript-library';
import { EVENTS, plainEvents } from './events';

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

    this.state = {
      widgetReady: false,
      dashboardDevices: [],
      variables: [],
    };

    this._headers = {};
    this.widget = new Widget(window.widgetId);
    this.api = UJL;
    window.addEventListener('message', this._listenMessage);
  }

  _getWidgetEventWithId(eventName) {
    return `${eventName}:${this.widget.getId()}`;
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
   * @deprecated Use setDashboardDevices instead
   */
  setDashboardDevice(deviceId) {
    this._sendPostMessage({ event: EVENTS.V1.SET_DASHBOARD_DEVICE, payload: deviceId });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.DEVICES.SELECTED, payload: deviceId });
  }

  /**
   * Set Dashboard Devices
   * @param {Array<String>|String} deviceIds - An array of device ids or API labels (starting with ~), or a comma-separated string of ids
   * @memberOf Ubidots
   */
  setDashboardDevices(deviceIds) {
    this._sendPostMessage({ event: EVENTS.V1.SET_DASHBOARD_DEVICES, payload: deviceIds });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.DEVICES.SELECTED, payload: deviceIds });
  }

  /**
   * Set Multiple Dashboard Devices
   * @param {Array<String>|String} deviceIds - An array of device ids, or a comma-separated string of ids
   * @memberOf Ubidots
   * @deprecated Use setDashboardDevices instead
   */
  setDashboardMultipleDevices(deviceIds) {
    this._sendPostMessage({ event: EVENTS.V1.SET_DASHBOARD_MULTIPLE_DEVICES, payload: deviceIds });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.DEVICES.SELECTED, payload: deviceIds });
  }

  /**
   * Set Dashboard Layer
   * @param {String} layerId - Layer id
   * @param {Object} [params] - Layer params
   * @memberOf Ubidots
   */
  setDashboardLayer(layerId, params = {}) {
    this._sendPostMessage({ event: EVENTS.V1.SET_DASHBOARD_LAYER, payload: { layerId, params } });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.SETTINGS.LAYER, payload: { layerId, params } });
  }

  /**
   * Set Dashboard Data Range
   * @property {number} start - Initial selected date
   * @property {number} end - End selected date
   * @memberOf Ubidots
   * @param range
   */
  setDashboardDateRange(range) {
    this._sendPostMessage({ event: EVENTS.V1.SELECTED_DASHBOARD_DATE_RANGE, payload: range });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.SETTINGS.DATERANGE, payload: range });
  }

  /**
   * Set Realtime
   * @param {Boolean} enableRealTime
   * @memberOf Ubidots
   */
  setRealTime(enableRealTime) {
    this._sendPostMessage({ event: EVENTS.V1.SET_REAL_TIME, payload: enableRealTime });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.SETTINGS.RT, payload: enableRealTime });
  }

  /**
   * Refresh the Dashboard
   * @memberOf Ubidots
   */
  refreshDashboard() {
    this._sendPostMessage({ event: EVENTS.V1.REFRESH_DASHBOARD });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.SETTINGS.REFRESHED });
  }

  /**
   * Set FullScreen
   * @param {String} fullScreenAction
   * @memberOf Ubidots
   */
  setFullScreen(fullScreenAction) {
    this._sendPostMessage({ event: EVENTS.V1.SET_FULLSCREEN, payload: fullScreenAction });
    this._sendPostMessage({ event: EVENTS.V2.DASHBOARD.SETTINGS.FULLSCREEN, payload: fullScreenAction });
  }

  /**
   * Open Drawer
   * @param {Object} drawerInfo
   * @property {String} url - url to open in the drawer
   * @property {Number} width - drawer's width
   * @memberOf Ubidots
   */
  openDrawer(drawerInfo) {
    this._sendPostMessage({ event: EVENTS.V1.OPEN_DRAWER, payload: { drawerInfo, id: this.widget.getId() } });
    this._sendPostMessage({ event: EVENTS.V2.WIDGET.OPEN_DRAWER, payload: { drawerInfo, id: this.widget.getId() } });
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

  _setDashboardDevices = devices => {
    this.state.dashboardDevices = devices;
  };

  get dashboardDevices() {
    return this.state.dashboardDevices;
  }

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

  _parseEvent = eventName => {
    if (!plainEvents.includes(eventName))
      return {
        isValidEvent: false,
        eventName,
      };

    const isWidgetEvent = eventName.includes('v2:widget:');

    if (isWidgetEvent) {
      const eventNameWithId = this._getWidgetEventWithId(eventName);
      return { isValidEvent: true, eventName: eventNameWithId };
    }
    return { isValidEvent: true, eventName };
  };

  /**
   * Make a window listener event to receive dashboard messages
   * @param {String} eventName - Event name to listen
   * @param {Function} [callback] - Function to execute when be listen to the message
   *
   * @memberOf Ubidots
   */
  on = (eventName, callback) => {
    const { isValidEvent, eventName: parsedEventName } = this._parseEvent(eventName);
    if (isValidEvent) {
      this._eventsCallback[parsedEventName] = callback;
    }
  };

  /**
   * Handle fullscreen V2 event
   * @param {Object} payload - Event payload
   * @private
   * @memberOf Ubidots
   */
  _handleFullScreen = payload => {
    if (typeof this._eventsCallback[EVENTS.V1.SET_FULLSCREEN] === 'function') {
      this._eventsCallback[EVENTS.V1.SET_FULLSCREEN](payload);
    }
  };

  /**
   * Handle device selected V2 event (single or multiple)
   * @param {String|Array} payload - Device id(s)
   * @private
   * @memberOf Ubidots
   */
  _handleDeviceSelected = payload => {
    if (Array.isArray(payload)) {
      this._setSelectedDevices(payload);
    } else {
      this._setSelectedDevice(payload);
    }
  };

  /**
   * Handle widget ready V2 event and set variables
   * @param {Array} payload - Variables array
   * @private
   * @memberOf Ubidots
   */
  _handleWidgetReady = payload => {
    this.widget.setVariables(payload);
  };

  /**
   * Handle widget data V2 event and set data to widget
   * @param {*} payload - Widget data
   * @private
   * @memberOf Ubidots
   */
  _handleWidgetData = payload => {
    this.widget.setData(payload);
  };

  /**
   * Handle widget error V2 event and set error state to widget
   * @param {*} payload - Widget error
   * @private
   * @memberOf Ubidots
   */
  _handleWidgetError = payload => {
    this.widget.setError(payload);
  };

  // eslint-disable-next-line class-methods-use-this
  _emitReady = () => {
    const eventNameWithId = this._getWidgetEventWithId(EVENTS.V2.WIDGET.READY);

    this._eventsCallback[eventNameWithId]?.();
    this._eventsCallback?.ready?.();
    window.parent.postMessage({ event: EVENTS.V1.READY, payload: { ready: true } }, window.location.origin);
    window.parent.postMessage({ event: eventNameWithId, payload: { ready: true } }, window.location.origin);
  };

  /**
   * Make a window listener event to receive dashboard messages and set data values to class attributes
   * @param {Object} event - Message event from window
   * @private
   * @memberOf Ubidots
   */
  _listenMessage = event => {
    if (event.origin !== window.location.origin) return;
    const { event: eventName, payload } = event.data;
    if (!eventName) return;

    const eventHandlers = {
      // V1 Events
      [EVENTS.V1.IS_REALTIME_ACTIVE]: this._setRealTime,
      [EVENTS.V1.RECEIVED_HEADERS]: this._setHeaders,
      [EVENTS.V1.RECEIVED_JWT_TOKEN]: this._setJWTToken,
      [EVENTS.V1.RECEIVED_TOKEN]: this._setToken,
      [EVENTS.V1.SELECTED_DATE_RANGE]: this._setDashboardDateRange,
      [EVENTS.V1.SELECTED_DASHBOARD_OBJECT]: this._setDashboardObject,
      [EVENTS.V1.SELECTED_DEVICE]: this._setSelectedDevice,
      [EVENTS.V1.SELECTED_DEVICES]: this._setSelectedDevices,
      [EVENTS.V1.SELECTED_DEVICE_OBJECT]: this._setDeviceObject,
      [EVENTS.V1.SELECTED_DEVICE_OBJECTS]: this._setSelectedDeviceObjects,
      [EVENTS.V1.SELECTED_FILTERS]: this._setSelectedFilters,
      [EVENTS.V1.SELECTED_DASHBOARD_DATE_RANGE]: this._setDashboardDateRange,

      // V2 Auth events
      [EVENTS.V2.AUTH.TOKEN]: this._setToken,
      [EVENTS.V2.AUTH.JWT]: this._setJWTToken,
      [EVENTS.V2.AUTH.HEADERS]: this._setHeaders,

      // V2 Dashboard settings events
      [EVENTS.V2.DASHBOARD.SETTINGS.DATERANGE]: this._setDashboardDateRange,
      [EVENTS.V2.DASHBOARD.SETTINGS.FILTERS]: this._setSelectedFilters,
      [EVENTS.V2.DASHBOARD.SETTINGS.RT]: this._setRealTime,
      [EVENTS.V2.DASHBOARD.SETTINGS.FULLSCREEN]: this._handleFullScreen,

      // V2 Dashboard device events
      [EVENTS.V2.DASHBOARD.DEVICES.SELECTED]: this._handleDeviceSelected,
      [EVENTS.V2.DASHBOARD.DEVICES.ALL_DEVICES]: this._setDashboardDevices,

      // V2 Dashboard self events
      [EVENTS.V2.DASHBOARD.SELF]: this._setDashboardObject,

      // Widget events
      [EVENTS.V2.WIDGET.DATA]: this._handleWidgetData,
      [EVENTS.V2.WIDGET.READY]: this._handleWidgetReady,
      [EVENTS.V2.WIDGET.ERROR]: this._handleWidgetError,
    };

    // External callbacks

    const { eventName: parsedEventName } = this._parseEvent(eventName);

    const handler = eventHandlers[parsedEventName];
    if (handler) handler(payload);

    if (typeof this._eventsCallback[parsedEventName] === 'function') {
      this._eventsCallback[parsedEventName](event.data.payload);
    }

    const allPropertiesReady =
      (this.token != null || this.jwtToken != null) &&
      this.selectedDevice != null &&
      this.selectedDevices != null &&
      this.dashboardDateRange != null &&
      this.realTime != null &&
      this.deviceObject != null &&
      this.selectedDeviceObjects != null &&
      this.dashboardObject != null &&
      this.selectedFilters != null;

    if (allPropertiesReady && !this.state.widgetReady) {
      this.state.widgetReady = true;
      this._emitReady();
    }
  };
}

export default Ubidots;
