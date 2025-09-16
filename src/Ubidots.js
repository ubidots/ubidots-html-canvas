import { Widget } from './Widget';
import { Ubidots as UJL } from '@ubidots/ubidots-javascript-library';
import EventBus from './EventBus';

/**
 * Event types constants for dashboard communication
 */
const EventTypes = {
  IS_REALTIME_ACTIVE: 'isRealTimeActive',
  OPEN_DRAWER: 'openDrawer',
  RECEIVED_HEADERS: 'receivedHeaders',
  RECEIVED_JWT_TOKEN: 'receivedJWTToken',
  RECEIVED_TOKEN: 'receivedToken',
  REFRESH_DASHBOARD: 'refreshDashboard',
  SELECTED_DASHBOARD_DATE_RANGE: 'selectedDashboardDateRange',
  SELECTED_DASHBOARD_OBJECT: 'selectedDashboardObject',
  SELECTED_DEVICE: 'selectedDevice',
  SELECTED_DEVICES: 'selectedDevices',
  SELECTED_DEVICE_OBJECT: 'selectedDeviceObject',
  SELECTED_DEVICE_OBJECTS: 'selectedDeviceObjects',
  SELECTED_FILTERS: 'selectedFilters',
  SET_DASHBOARD_DATE_RANGE: 'setDashboardDateRange',
  SET_DASHBOARD_DEVICE: 'setDashboardDevice',
  SET_DASHBOARD_LAYER: 'setDashboardLayer',
  SET_DASHBOARD_MULTIPLE_DEVICES: 'setDashboardMultipleDevices',
  SET_FULL_SCREEN: 'setFullScreen',
  SET_REAL_TIME: 'setRealTime',
  READY: 'ready',
  DASHBOARD_REFRESHED: 'dashboardRefreshed',
};

/**
 * Ubidots HTML Canvas communication library
 * Provides a clean interface for widget-dashboard communication using pub/sub pattern
 * @class Ubidots
 */
class Ubidots {
  constructor() {
    this._initializeProperties();
    this._initializeEventBus();
    this._initializeMessageListener();
  }

  /**
   * Initialize internal properties
   * @private
   */
  _initializeProperties() {
    this._state = {
      token: undefined,
      jwtToken: undefined,
      headers: {},
      selectedDevice: undefined,
      selectedDevices: undefined,
      selectedDeviceObjects: undefined,
      deviceObject: undefined,
      dashboardDateRange: undefined,
      dashboardObject: undefined,
      selectedFilters: undefined,
      realTime: undefined,
    };

    this.widget = new Widget(window.widgetId);
    this.api = UJL;
  }

  /**
   * Initialize event bus for pub/sub pattern
   * @private
   */
  _initializeEventBus() {
    this.eventBus = new EventBus();
    this._setupInternalSubscriptions();
  }

  /**
   * Setup internal event subscriptions
   * @private
   */
  _setupInternalSubscriptions() {
    const stateUpdaters = {
      [EventTypes.RECEIVED_TOKEN]: token => (this._state.token = token),
      [EventTypes.RECEIVED_JWT_TOKEN]: jwt => (this._state.jwtToken = jwt),
      [EventTypes.RECEIVED_HEADERS]: headers => (this._state.headers = headers || {}),
      [EventTypes.SELECTED_DEVICE]: device => (this._state.selectedDevice = device),
      [EventTypes.SELECTED_DEVICES]: devices => (this._state.selectedDevices = devices),
      [EventTypes.SELECTED_DEVICE_OBJECT]: obj => (this._state.deviceObject = obj),
      [EventTypes.SELECTED_DEVICE_OBJECTS]: objs => (this._state.selectedDeviceObjects = objs),
      [EventTypes.SELECTED_DASHBOARD_DATE_RANGE]: range => (this._state.dashboardDateRange = range),
      [EventTypes.SELECTED_DASHBOARD_OBJECT]: obj => (this._state.dashboardObject = obj),
      [EventTypes.SELECTED_FILTERS]: filters => (this._state.selectedFilters = filters),
      [EventTypes.IS_REALTIME_ACTIVE]: active => (this._state.realTime = active),
    };

    Object.entries(stateUpdaters).forEach(([event, updater]) => {
      this.eventBus.subscribe(event, updater);
    });
  }

  /**
   * Initialize message listener for window communication
   * @private
   */
  _initializeMessageListener() {
    window.addEventListener('message', this._handleMessage);
  }

  /**
   * Handle incoming window messages
   * @private
   */
  _handleMessage = event => {
    if (!this._isValidOrigin(event.origin)) return;

    const { event: eventName, payload } = event.data || {};
    if (!eventName) return;

    this.eventBus.publish(eventName, payload);
    this._checkReadyState();
  };

  /**
   * Validate message origin
   * @private
   */
  _isValidOrigin(origin) {
    return origin === window.location.origin;
  }

  /**
   * Check if widget is ready and emit ready event
   * @private
   */
  _checkReadyState() {
    const isReady = this._hasAuthentication() && this._hasRequiredState();

    if (isReady) {
      this.eventBus.publish(EventTypes.READY);
    }
  }

  /**
   * Check if we have authentication
   * @private
   */
  _hasAuthentication() {
    return !!(this._state.token || this._state.jwtToken);
  }

  /**
   * Check if we have required state initialized
   * @private
   */
  _hasRequiredState() {
    return (
      this._state.selectedDevice !== undefined &&
      this._state.dashboardDateRange !== undefined &&
      this._state.dashboardObject !== undefined
    );
  }

  // ============================================================
  // Public API - Event Subscription Methods
  // ============================================================

  /**
   * Subscribe to events
   * @param {String} eventName - Event name to listen
   * @param {Function} callback - Callback function
   * @memberOf Ubidots
   */
  on(eventName, callback) {
    this.eventBus.subscribe(eventName, callback);
  }

  /**
   * Subscribe to events (alias for on)
   * @param {String} eventName - Event name to listen
   * @param {Function} callback - Callback function
   * @memberOf Ubidots
   */
  listen(eventName, callback) {
    this.on(eventName, callback);
  }

  /**
   * Unsubscribe from events
   * @param {String} eventName - Event name
   * @param {Function} callback - Callback to remove
   * @memberOf Ubidots
   */
  off(eventName, callback) {
    this.eventBus.unsubscribe(eventName, callback);
  }

  /**
   * Emit event to local subscribers
   * @param {String} eventName - Event name
   * @param {*} data - Event data
   * @memberOf Ubidots
   */
  emit(eventName, data) {
    this.eventBus.publish(eventName, data);
  }

  // ============================================================
  // Public API - Dashboard Communication Methods
  // ============================================================

  /**
   * Send message to parent window
   * @param {String} event - Event name
   * @param {*} payload - Event payload
   * @memberOf Ubidots
   */
  postMessage(event, payload = undefined) {
    window.parent.postMessage({ event, payload }, window.location.origin);
    this.emit(event, payload);
  }

  /**
   * Set dashboard device
   * @param {String} deviceId - Device ID or API label
   * @memberOf Ubidots
   */
  setDashboardDevice(deviceId) {
    this.postMessage(EventTypes.SET_DASHBOARD_DEVICE, deviceId);
  }

  /**
   * Set multiple dashboard devices
   * @param {Array<String>} deviceIds - Array of device IDs
   * @memberOf Ubidots
   */
  setDashboardMultipleDevices(deviceIds) {
    this.postMessage(EventTypes.SET_DASHBOARD_MULTIPLE_DEVICES, deviceIds);
  }

  /**
   * Set dashboard layer
   * @param {String} layerId - Layer ID
   * @memberOf Ubidots
   */
  setDashboardLayer(layerId) {
    this.postMessage(EventTypes.SET_DASHBOARD_LAYER, layerId);
  }

  /**
   * Set dashboard date range
   * @param {Object} range - Date range with start and end
   * @memberOf Ubidots
   */
  setDashboardDateRange(range) {
    this.postMessage(EventTypes.SET_DASHBOARD_DATE_RANGE, range);
  }

  /**
   * Enable/disable real-time updates
   * @param {Boolean} enableRealTime - Enable real-time flag
   * @memberOf Ubidots
   */
  setRealTime(enableRealTime) {
    this.postMessage(EventTypes.SET_REAL_TIME, enableRealTime);
  }

  /**
   * Refresh dashboard
   * @memberOf Ubidots
   */
  refreshDashboard() {
    this.postMessage(EventTypes.REFRESH_DASHBOARD);
  }

  /**
   * Set fullscreen mode
   * @param {String} fullScreenAction - Fullscreen action
   * @memberOf Ubidots
   */
  setFullScreen(fullScreenAction) {
    this.postMessage(EventTypes.SET_FULL_SCREEN, fullScreenAction);
  }

  /**
   * Open drawer with content
   * @param {Object} drawerInfo - Drawer configuration
   * @memberOf Ubidots
   */
  openDrawer(drawerInfo) {
    const payload = {
      drawerInfo,
      id: this.widget.getId(),
    };
    this.postMessage(EventTypes.OPEN_DRAWER, payload);
  }

  // ============================================================
  // Public API - State Getters
  // ============================================================

  /**
   * Get user token
   * @returns {String} User token
   */
  get token() {
    return this._state.token;
  }

  /**
   * Get JWT token
   * @returns {String} JWT token
   */
  get jwtToken() {
    return this._state.jwtToken;
  }

  /**
   * Get selected device
   * @returns {String} Selected device ID
   */
  get selectedDevice() {
    return this._state.selectedDevice;
  }

  /**
   * Get selected devices
   * @returns {Array} Selected device IDs
   */
  get selectedDevices() {
    return this._state.selectedDevices;
  }

  /**
   * Get selected device objects
   * @returns {Array} Selected device objects
   */
  get selectedDeviceObjects() {
    return this._state.selectedDeviceObjects;
  }

  /**
   * Get device object
   * @returns {Object} Device object
   */
  get deviceObject() {
    return this._state.deviceObject;
  }

  /**
   * Get dashboard date range
   * @returns {Object} Date range with start and end
   */
  get dashboardDateRange() {
    return this._state.dashboardDateRange;
  }

  /**
   * Get dashboard object
   * @returns {Object} Dashboard object
   */
  get dashboardObject() {
    return this._state.dashboardObject;
  }

  /**
   * Get selected filters
   * @returns {Array} Selected filters
   */
  get selectedFilters() {
    return this._state.selectedFilters;
  }

  /**
   * Get real-time status
   * @returns {Boolean} Real-time enabled flag
   */
  get realTime() {
    return this._state.realTime;
  }

  /**
   * Get widget instance
   * @returns {Widget} Widget instance
   */
  getWidget() {
    return this.widget;
  }

  /**
   * Get headers for API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      ...this._state.headers,
      'Content-Type': 'application/json',
    };

    if (this._state.token) {
      headers['X-Auth-Token'] = this._state.token;
    } else if (this._state.jwtToken) {
      headers['Authorization'] = `Bearer ${this._state.jwtToken}`;
    }

    return headers;
  }

  /**
   * Get header (deprecated, use getHeaders)
   * @deprecated Use getHeaders() instead
   */
  get getHeader() {
    return this.getHeaders();
  }

  // ============================================================
  // Private API - State Setters (for backwards compatibility)
  // ============================================================

  _setToken = token => {
    this._state.token = token;
    this.emit(EventTypes.RECEIVED_TOKEN, token);
  };

  _setJWTToken = jwt => {
    this._state.jwtToken = jwt;
    this.emit(EventTypes.RECEIVED_JWT_TOKEN, jwt);
  };

  _setHeaders = (headers = {}) => {
    this._state.headers = headers;
    this.emit(EventTypes.RECEIVED_HEADERS, headers);
  };

  _setSelectedDevice = selectedDevice => {
    this._state.selectedDevice = selectedDevice;
    this.emit(EventTypes.SELECTED_DEVICE, selectedDevice);
  };

  _setSelectedDevices = deviceIdsArray => {
    this._state.selectedDevices = deviceIdsArray;
    this.emit(EventTypes.SELECTED_DEVICES, deviceIdsArray);
  };

  _setDashboardDateRange = dashboardDateRange => {
    this._state.dashboardDateRange = dashboardDateRange;
    this.emit(EventTypes.SELECTED_DASHBOARD_DATE_RANGE, dashboardDateRange);
  };

  _setRealTime = realTime => {
    this._state.realTime = realTime;
    this.emit(EventTypes.IS_REALTIME_ACTIVE, realTime);
  };

  _setDeviceObject = deviceObject => {
    this._state.deviceObject = deviceObject;
    this.emit(EventTypes.SELECTED_DEVICE_OBJECT, deviceObject);
  };

  _setSelectedDeviceObjects = selectedDeviceObjectsList => {
    this._state.selectedDeviceObjects = selectedDeviceObjectsList;
    this.emit(EventTypes.SELECTED_DEVICE_OBJECTS, selectedDeviceObjectsList);
  };

  _setDashboardObject = dashboardObject => {
    this._state.dashboardObject = dashboardObject;
    this.emit(EventTypes.SELECTED_DASHBOARD_OBJECT, dashboardObject);
  };

  _setSelectedFilters = selectedFilters => {
    this._state.selectedFilters = selectedFilters;
    this.emit(EventTypes.SELECTED_FILTERS, selectedFilters);
  };

  /**
   * Legacy method for backwards compatibility
   * @private
   * @deprecated
   */
  _listenMessage = this._handleMessage;
}

export default Ubidots;
