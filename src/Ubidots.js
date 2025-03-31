import { Widget } from './Widget';
import { Ubidots as UJL } from '@ubidots/ubidots-javascript-library';

/**
 * List of events the Ubidots class can listen to.
 * @type {Object}
 */
const EVENTS = {
  DASHBOARD_REFRESHED: 'dashboardRefreshed',
  IS_REAL_TIME_ACTIVE: 'isRealTimeActive',
  READY: 'ready',
  RECEIVED_HEADERS: 'receivedHeaders',
  RECEIVED_JWT_TOKEN: 'receivedJWTToken',
  RECEIVED_TOKEN: 'receivedToken',
  SELECTED_DASHBOARD_DATE_RANGE: 'selectedDashboardDateRange',
  SELECTED_DASHBOARD_OBJECT: 'selectedDashboardObject',
  SELECTED_DEVICE: 'selectedDevice',
  SELECTED_DEVICE_OBJECT: 'selectedDeviceObject',
  SELECTED_DEVICES: 'selectedDevices',
  SELECTED_DEVICE_OBJECTS: 'selectedDeviceObjects',
  SELECTED_FILTERS: 'selectedFilters',
};

/**
 * Map of event names to property names
 * @type {Object}
 */
const EVENT_TO_PROPERTY_MAP = {
  isRealTimeActive: '_realTime',
  receivedHeaders: '_headers',
  receivedJWTToken: '_jwtToken',
  receivedToken: '_token',
  selectedDashboardDateRange: '_dashboardDateRange',
  selectedDashboardObject: '_dashboardObject',
  selectedDevice: '_selectedDevice',
  selectedDeviceObject: '_deviceObject',
  selectedDevices: '_selectedDevices',
  selectedDeviceObjects: '_selectedDeviceObjects',
  selectedFilters: '_selectedFilters',
};

/**
 * Default trusted origins for postMessage communication
 * The empty string represents same-origin communication
 * @type {Array<string>}
 */
const DEFAULT_TRUSTED_ORIGINS = [''];

/**
 * Ubidots class for communicating with Ubidots dashboards.
 * Provides methods to interact with the dashboard and handle events.
 */
class Ubidots {
  /**
   * Creates a new Ubidots instance.
   * @param {Object} [options] - Configuration options
   * @param {Array<string>} [options.trustedOrigins] - List of trusted origins to accept messages from
   */
  constructor(options = {}) {
    // Initialize state object to hold all properties
    this._state = {
      headers: {},
      token: null,
      jwtToken: null,
      selectedDevice: null,
      selectedDevices: null,
      dashboardDateRange: null,
      realTime: null,
      deviceObject: null,
      selectedDeviceObjects: null,
      dashboardObject: null,
      selectedFilters: null,
    };

    // Set up trusted origins for postMessage security
    this._trustedOrigins = options.trustedOrigins || DEFAULT_TRUSTED_ORIGINS;

    // The target origin for sending messages - defaults to current origin
    this._targetOrigin = options.targetOrigin || window.location.origin;

    // Initialize event callbacks
    this._eventsCallback = Object.values(EVENTS).reduce((acc, event) => {
      acc[event] = null;
      return acc;
    }, {});

    // Initialize widget and API
    this.widget = new Widget(window.widgetId);
    this.api = UJL;

    // Bind methods to this instance
    this._listenMessage = this._listenMessage.bind(this);
    this._processMessage = this._processMessage.bind(this);
    this._validatePayload = this._validatePayload.bind(this);

    // Add event listener
    window.addEventListener('message', this._listenMessage);
  }

  /**
   * Sends a post message to the parent window.
   * @param {Object} options - The message options.
   * @param {string} options.event - The event name.
   * @param {*} options.payload - The event payload.
   * @param {string} [options.targetOrigin] - Target origin to send the message to.
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _sendPostMessage({ event, payload, targetOrigin }) {
    if (!event) {
      console.error('Event name is required');
      return;
    }

    try {
      // Sanitize the event name
      const safeEvent = String(event);

      // Use the provided targetOrigin or default to class setting
      const origin = targetOrigin || this._targetOrigin;

      // Validate payload before sending - removes potentially dangerous data
      const safePayload = this._sanitizeData(payload);

      window.parent.postMessage({ event: safeEvent, payload: safePayload }, origin);
    } catch (error) {
      console.error('Failed to send post message:', error);
    }
  }

  /**
   * Sanitizes data to prevent XSS and injection attacks
   * @param {*} data - The data to sanitize
   * @returns {*} - Sanitized data
   * @private
   */
  _sanitizeData(data) {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Enhanced XSS protection - remove dangerous HTML tags, attributes, and URIs
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<\s*img[^>]*onerror[^>]*>/gi, '')
        .replace(/<[^>]*style\s*=[^>]*expression[^>]*>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:\s*[^;]*script/gi, 'data-blocked');
    }

    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(item => this._sanitizeData(item));
      }

      const sanitizedObj = {};
      for (const key in data) {
        // Prevent prototype pollution by excluding dangerous properties
        if (Object.prototype.hasOwnProperty.call(data, key) &&
          !['__proto__', 'constructor', 'prototype'].includes(key)) {
          sanitizedObj[key] = this._sanitizeData(data[key]);
        }
      }
      return sanitizedObj;
    }

    // Numbers, booleans, etc. are safe to pass through
    return data;
  }

  /**
   * Validates if an origin is trusted
   * @param {string} origin - The origin to validate
   * @returns {boolean} - True if the origin is trusted
   * @private
   */
  _isOriginTrusted(origin) {
    // If the trusted origins list includes an empty string, same-origin messages are allowed
    const isSameOriginAllowed = this._trustedOrigins.includes('');
    const isSameOrigin = origin === window.location.origin;

    // Allow same-origin messages if permitted
    if (isSameOrigin && isSameOriginAllowed) {
      return true;
    }

    // Check if the origin is in the trusted origins list
    return this._trustedOrigins.includes(origin);
  }

  /**
   * Validates the payload shape and type for a specific event
   * @param {string} eventName - The event name
   * @param {*} payload - The event payload
   * @returns {boolean} - True if the payload is valid for the event
   * @private
   */
  /* eslint-disable indent, class-methods-use-this */
  _validatePayload(eventName, payload) {
    // Validation rules for each event type
    const validationRules = {
      receivedToken: (p) => typeof p === 'string' && p.length > 0,
      receivedJWTToken: (p) => typeof p === 'string' && p.length > 0,
      selectedDevice: (p) => typeof p === 'string',
      selectedDevices: (p) => Array.isArray(p) && p.every(id => typeof id === 'string'),
      selectedDashboardDateRange: (p) => (
        p &&
        typeof p === 'object' &&
        typeof p.start === 'number' &&
        typeof p.end === 'number'
      ),
      isRealTimeActive: (p) => typeof p === 'boolean',
      receivedHeaders: (p) => p && typeof p === 'object' && !Array.isArray(p),
      selectedDashboardObject: (p) => p && typeof p === 'object' && p.id,
      selectedDeviceObject: (p) => p && typeof p === 'object' && p.id,
      selectedDeviceObjects: (p) => Array.isArray(p) && p.every(obj => obj && typeof obj === 'object' && obj.id),
      selectedFilters: (p) => Array.isArray(p)
    };

    // Check if there's a validation rule for this event
    if (validationRules[eventName]) {
      return validationRules[eventName](payload);
    }

    // Default to true for unknown events
    return true;
  }
  /* eslint-enable indent, class-methods-use-this */

  /**
   * Add a trusted origin to the whitelist
   * @param {string} origin - The origin to trust
   */
  addTrustedOrigin(origin) {
    if (typeof origin !== 'string') {
      console.error('Origin must be a string');
      return;
    }

    if (!this._trustedOrigins.includes(origin)) {
      this._trustedOrigins.push(origin);
    }
  }

  /**
   * Remove a trusted origin from the whitelist
   * @param {string} origin - The origin to remove
   */
  removeTrustedOrigin(origin) {
    const index = this._trustedOrigins.indexOf(origin);
    if (index !== -1) {
      this._trustedOrigins.splice(index, 1);
    }
  }

  /**
   * Sets the target origin for outgoing messages
   * @param {string} origin - The target origin
   */
  setTargetOrigin(origin) {
    if (typeof origin !== 'string') {
      console.error('Origin must be a string');
      return;
    }

    // Prevent wildcard origin for security
    if (origin === '*') {
      console.error('Wildcard origins (*) are not allowed for security reasons');
      return;
    }

    this._targetOrigin = origin;
  }

  /**
   * Sets the selected device for the dashboard.
   * @param {string} deviceId - The device ID.
   */
  setDashboardDevice(deviceId) {
    if (!deviceId) {
      console.error('Device ID is required');
      return;
    }
    this._sendPostMessage({ event: 'setDashboardDevice', payload: deviceId });
  }

  /**
   * Sets multiple selected devices for the dashboard.
   * @param {string[]} deviceIds - Array of device IDs.
   */
  setDashboardMultipleDevices(deviceIds) {
    if (!Array.isArray(deviceIds)) {
      console.error('Device IDs must be an array');
      return;
    }
    this._sendPostMessage({ event: 'setDashboardMultipleDevices', payload: deviceIds });
  }

  /**
   * Sets the date range for the dashboard.
   * @param {Object} range - The date range.
   * @param {number} range.start - Start timestamp.
   * @param {number} range.end - End timestamp.
   */
  setDashboardDateRange(range) {
    if (!range || typeof range !== 'object' || !range.start || !range.end) {
      console.error('Range must be an object with start and end properties');
      return;
    }
    this._sendPostMessage({
      event: 'setDashboardDateRange',
      payload: range,
    });
  }

  /**
   * Sets whether real-time updates are enabled.
   * @param {boolean} enableRealTime - Whether to enable real-time updates.
   */
  setRealTime(enableRealTime) {
    this._sendPostMessage({ event: 'setRealTime', payload: !!enableRealTime });
  }

  /**
   * Refreshes the dashboard.
   */
  refreshDashboard() {
    this._sendPostMessage({ event: 'refreshDashboard' });
  }

  /**
   * Sets the full screen state.
   * @param {string} fullScreenAction - The full screen action.
   */
  setFullScreen(fullScreenAction) {
    if (!fullScreenAction) {
      console.error('Full screen action is required');
      return;
    }
    this._sendPostMessage({
      event: 'setFullScreen',
      payload: fullScreenAction,
    });
  }

  /**
   * Opens a drawer.
   * @param {Object} drawerInfo - The drawer information.
   * @param {string} drawerInfo.url - URL to open in the drawer.
   * @param {number} drawerInfo.width - Drawer's width.
   */
  openDrawer(drawerInfo) {
    if (!drawerInfo || typeof drawerInfo !== 'object') {
      console.error('Drawer info must be an object');
      return;
    }

    if (!drawerInfo.url) {
      console.error('Drawer URL is required');
      return;
    }

    // Validate URL to prevent XSS
    try {
      const url = new URL(drawerInfo.url);

      // Check for dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousProtocols.some(protocol => url.protocol.toLowerCase() === protocol)) {
        console.error('Potentially dangerous URL protocol not allowed');
        return;
      }

      // Create a sanitized drawerInfo object
      const safeDrawerInfo = {
        ...drawerInfo,
        url: url.toString(), // Use the parsed and normalized URL
      };

      this._sendPostMessage({
        event: 'openDrawer',
        payload: { drawerInfo: safeDrawerInfo, id: this.widget.getId() },
      });
    } catch (e) {
      console.error('Invalid drawer URL');
      return;
    }
  }

  /**
   * Gets the widget instance.
   * @returns {Widget} The widget instance.
   */
  getWidget() {
    return this.widget;
  }

  /**
   * Gets the headers including auth token.
   * @returns {Object} Headers including auth token.
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
   * Processes messages from the parent window.
   * @param {Object} data - The message data.
   * @param {string} origin - The origin of the message.
   * @private
   */
  _processMessage(data, origin) {
    const { event, payload } = data;

    // Skip if the event is not recognized
    if (!Object.values(EVENTS).includes(event)) {
      console.warn(`Ignoring unrecognized event: ${event}`);
      return;
    }

    // Validate payload for the specific event type
    if (!this._validatePayload(event, payload)) {
      console.warn(`Invalid payload for event ${event}:`, payload);
      return;
    }

    // Additional validation for token-related events
    if (event === 'receivedJWTToken' && !this._validateJWT(payload)) {
      console.warn('Invalid JWT token received');
      return;
    }

    // Log received messages from external origins for security monitoring
    if (origin !== window.location.origin) {
      console.info(`Processing cross-origin message from ${origin}`, { event });
    }

    // Update state - use sanitized data for extra security
    if (EVENT_TO_PROPERTY_MAP[event]) {
      const sanitizedPayload = this._sanitizeData(payload);
      this._state[EVENT_TO_PROPERTY_MAP[event].slice(1)] = sanitizedPayload;
    }

    // Call the event callback if defined
    if (typeof this._eventsCallback[event] === 'function') {
      try {
        this._eventsCallback[event](payload);
      } catch (error) {
        console.error(`Error in callback for event ${event}:`, error);
      }
    }

    // Call the ready callback if all required data is available
    if (
      (this._state.token || this._state.jwtToken) &&
      this._state.selectedDevice !== undefined &&
      this._state.dashboardDateRange !== undefined &&
      this._state.dashboardObject !== undefined &&
      typeof this._eventsCallback.ready === 'function'
    ) {
      try {
        this._eventsCallback.ready();
        this._eventsCallback.ready = null; // Ensure ready is only called once
      } catch (error) {
        console.error('Error in ready callback:', error);
      }
    }
  }

  /**
   * Listens for messages from any window.
   * @param {MessageEvent} event - The message event.
   * @private
   */
  _listenMessage(event) {
    // Check if the origin is trusted
    if (!this._isOriginTrusted(event.origin)) {
      console.warn(`Ignoring message from untrusted origin: ${event.origin}`);
      return;
    }

    // Basic validation of message structure
    if (!event.data || typeof event.data !== 'object') {
      console.warn('Ignoring invalid message format');
      return;
    }

    // Check for required event property
    if (!event.data.event || typeof event.data.event !== 'string') {
      console.warn('Ignoring message without valid event property');
      return;
    }

    // Now process the message with specific event validation
    this._processMessage(event.data, event.origin);
  }

  /**
   * Registers a callback for an event.
   * @param {string} eventName - The name of the event.
   * @param {Function} [callback] - The callback function.
   */
  on(eventName, callback = undefined) {
    if (Object.keys(this._eventsCallback).includes(eventName)) {
      this._eventsCallback[eventName] = callback;
    }
  }

  // Getters for all state properties
  get token() {
    return this._state.token;
  }
  get jwtToken() {
    return this._state.jwtToken;
  }
  get selectedDevice() {
    return this._state.selectedDevice;
  }
  get selectedDevices() {
    return this._state.selectedDevices;
  }
  get dashboardDateRange() {
    return this._state.dashboardDateRange;
  }
  get realTime() {
    return this._state.realTime;
  }
  get deviceObject() {
    return this._state.deviceObject;
  }
  get selectedDeviceObjects() {
    return this._state.selectedDeviceObjects;
  }
  get dashboardObject() {
    return this._state.dashboardObject;
  }
  get selectedFilters() {
    return this._state.selectedFilters;
  }

  // Compatibility with old getHeader name
  get getHeader() {
    return this.getHeaders();
  }

  /**
   * Validates JWT token structure and expiration
   * @param {string} token - The JWT token
   * @returns {boolean} - True if the token is valid
   * @private
   */
  _validateJWT(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      // Basic structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Check if the token parts are valid base64
      const header = JSON.parse(this._base64UrlDecode(parts[0]));
      const payload = JSON.parse(this._base64UrlDecode(parts[1]));

      // Check token type
      if (!header.typ || !header.alg) {
        return false;
      }

      // Check for expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.warn('JWT token has expired');
        return false;
      }

      return true;
    } catch (e) {
      console.error('JWT validation error:', e);
      return false;
    }
  }

  /**
   * Decodes a base64url encoded string
   * @param {string} str - The base64url encoded string
   * @returns {string} - The decoded string
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _base64UrlDecode(str) {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with = if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}

export default Ubidots;
