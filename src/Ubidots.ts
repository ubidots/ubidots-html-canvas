import { Widget } from './Widget';
import { Ubidots as UJL } from '@ubidots/ubidots-javascript-library';
import EventBus from './EventBus';
import type {
  UbidotsAPI,
  EventTypes,
  EventDataMap,
  EventCallback,
  DashboardDateRange,
  DeviceObject,
  DashboardObject,
  FilterObject,
  Headers,
  DrawerInfo,
  PostMessageData,
  WidgetAPI
} from './types';

/**
 * Event types constants for dashboard communication
 */
const EventTypesEnum: Record<keyof typeof EventTypes, string> = {
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
} as const;

/**
 * @category Main Classes
 * Ubidots HTML Canvas communication library
 * Provides a clean interface for widget-dashboard communication using pub/sub pattern
 *
 * @example
 * ```typescript
 * const ubidots = new Ubidots();
 *
 * // Listen to events
 * ubidots.listen('receivedToken', (token) => {
 *   console.log('Received token:', token);
 * });
 *
 * // Set dashboard device
 * ubidots.setDashboardDevice('device-123');
 *
 * // Get current state
 * console.log('Selected device:', ubidots.selectedDevice);
 * ```
 */
export default class Ubidots implements UbidotsAPI {
  /** Event bus for pub/sub pattern */
  public readonly eventBus: EventBus;

  /** Internal state */
  private _state: {
    token: string | undefined;
    jwtToken: string | undefined;
    headers: Record<string, string>;
    selectedDevice: string | undefined;
    selectedDevices: string[] | undefined;
    selectedDeviceObjects: DeviceObject[] | undefined;
    deviceObject: DeviceObject | undefined;
    dashboardDateRange: DashboardDateRange | undefined;
    dashboardObject: DashboardObject | undefined;
    selectedFilters: FilterObject[] | undefined;
    realTime: boolean | undefined;
  };

  /** Widget instance */
  public readonly widget: WidgetAPI;

  /** Ubidots JavaScript Library instance */
  public readonly api: typeof UJL;

  /**
   * Create a new Ubidots instance
   *
   * @example
   * ```typescript
   * const ubidots = new Ubidots();
   * ```
   */
  constructor() {
    // Initialize state first
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
    this.eventBus = new EventBus();

    this._initializeEventBus();
    this._initializeMessageListener();
  }

  /**
   * Initialize event bus for pub/sub pattern
   * @private
   */
  private _initializeEventBus(): void {
    this._setupInternalSubscriptions();
  }

  /**
   * Setup internal event subscriptions
   * @private
   */
  private _setupInternalSubscriptions(): void {
    const stateUpdaters: Record<string, (data: unknown) => void> = {
      [EventTypesEnum.RECEIVED_TOKEN]: (token: unknown) => {
        this._state.token = token as string;
      },
      [EventTypesEnum.RECEIVED_JWT_TOKEN]: (jwt: unknown) => {
        this._state.jwtToken = jwt as string;
      },
      [EventTypesEnum.RECEIVED_HEADERS]: (headers: unknown) => {
        this._state.headers = (headers as Record<string, string>) ?? {};
      },
      [EventTypesEnum.SELECTED_DEVICE]: (device: unknown) => {
        this._state.selectedDevice = device as string;
      },
      [EventTypesEnum.SELECTED_DEVICES]: (devices: unknown) => {
        this._state.selectedDevices = devices as string[];
      },
      [EventTypesEnum.SELECTED_DEVICE_OBJECT]: (obj: unknown) => {
        this._state.deviceObject = obj as DeviceObject;
      },
      [EventTypesEnum.SELECTED_DEVICE_OBJECTS]: (objs: unknown) => {
        this._state.selectedDeviceObjects = objs as DeviceObject[];
      },
      [EventTypesEnum.SELECTED_DASHBOARD_DATE_RANGE]: (range: unknown) => {
        this._state.dashboardDateRange = range as DashboardDateRange;
      },
      [EventTypesEnum.SELECTED_DASHBOARD_OBJECT]: (obj: unknown) => {
        this._state.dashboardObject = obj as DashboardObject;
      },
      [EventTypesEnum.SELECTED_FILTERS]: (filters: unknown) => {
        this._state.selectedFilters = filters as FilterObject[];
      },
      [EventTypesEnum.IS_REALTIME_ACTIVE]: (active: unknown) => {
        this._state.realTime = active as boolean;
      },
    };

    Object.entries(stateUpdaters).forEach(([event, updater]) => {
      this.eventBus.subscribe(event, updater);
    });
  }

  /**
   * Initialize message listener for window communication
   * @private
   */
  private _initializeMessageListener(): void {
    window.addEventListener('message', this._handleMessage);
  }

  /**
   * Handle incoming window messages
   * @private
   */
  private readonly _handleMessage = (event: MessageEvent<PostMessageData>): void => {
    if (!this._isValidOrigin(event.origin)) {
      return;
    }

    const { event: eventName, payload } = event.data ?? {};
    if (!eventName) {
      return;
    }

    this.eventBus.publish(eventName, payload);
    this._checkReadyState();
  };

  /**
   * Validate message origin
   * @private
   */
  private _isValidOrigin(origin: string): boolean {
    return origin === window.location.origin;
  }

  /**
   * Check if widget is ready and emit ready event
   * @private
   */
  private _checkReadyState(): void {
    const isReady = this._hasAuthentication() && this._hasRequiredState();

    if (isReady) {
      this.eventBus.publish(EventTypesEnum.READY);
    }
  }

  /**
   * Check if we have authentication
   * @private
   */
  private _hasAuthentication(): boolean {
    return Boolean(this._state.token ?? this._state.jwtToken);
  }

  /**
   * Check if we have required state initialized
   * @private
   */
  private _hasRequiredState(): boolean {
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
   *
   * @param eventName - Event name to listen to
   * @param callback - Callback function to execute
   *
   * @example
   * ```typescript
   * ubidots.on('receivedToken', (token) => {
   *   console.log('Token received:', token);
   * });
   * ```
   */
  on<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  on(eventName: string, callback: EventCallback): void;
  on(eventName: string, callback: EventCallback): void {
    this.eventBus.subscribe(eventName, callback);
  }

  /**
   * Subscribe to events (alias for on)
   *
   * @param eventName - Event name to listen to
   * @param callback - Callback function to execute
   *
   * @example
   * ```typescript
   * ubidots.listen('selectedDevice', (deviceId) => {
   *   console.log('Device selected:', deviceId);
   * });
   * ```
   */
  listen<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  listen(eventName: string, callback: EventCallback): void;
  listen(eventName: string, callback: EventCallback): void {
    this.on(eventName, callback);
  }

  /**
   * Unsubscribe from events
   *
   * @param eventName - Event name to unsubscribe from
   * @param callback - Callback function to remove
   *
   * @example
   * ```typescript
   * const callback = (token) => console.log(token);
   * ubidots.on('receivedToken', callback);
   * ubidots.off('receivedToken', callback);
   * ```
   */
  off<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  off(eventName: string, callback: EventCallback): void;
  off(eventName: string, callback: EventCallback): void {
    this.eventBus.unsubscribe(eventName, callback);
  }

  /**
   * Emit event to local subscribers
   *
   * @param eventName - Event name to emit
   * @param data - Event data to pass to callbacks
   *
   * @example
   * ```typescript
   * ubidots.emit('customEvent', { message: 'Hello' });
   * ```
   */
  emit<K extends keyof EventDataMap>(
    eventName: K,
    data: EventDataMap[K]
  ): void;
  emit(eventName: string, data?: unknown): void;
  emit(eventName: string, data?: unknown): void {
    this.eventBus.publish(eventName, data);
  }

  // ============================================================
  // Public API - Dashboard Communication Methods
  // ============================================================

  /**
   * Send message to parent window
   *
   * @param event - Event name
   * @param payload - Event payload (optional)
   *
   * @example
   * ```typescript
   * ubidots.postMessage('customEvent', { data: 'value' });
   * ```
   */
  postMessage(event: string, payload?: unknown): void {
    window.parent.postMessage({ event, payload }, window.location.origin);
    this.emit(event, payload);
  }

  /**
   * Set dashboard device
   *
   * @param deviceId - Device ID or API label (starting with ~)
   *
   * @example
   * ```typescript
   * ubidots.setDashboardDevice('device-123');
   * ubidots.setDashboardDevice('~my-device-label');
   * ```
   */
  setDashboardDevice(deviceId: string): void {
    this.postMessage(EventTypesEnum.SET_DASHBOARD_DEVICE, deviceId);
  }

  /**
   * Set multiple dashboard devices
   *
   * @param deviceIds - Array of device IDs
   *
   * @example
   * ```typescript
   * ubidots.setDashboardMultipleDevices(['device-1', 'device-2', 'device-3']);
   * ```
   */
  setDashboardMultipleDevices(deviceIds: string[]): void {
    this.postMessage(EventTypesEnum.SET_DASHBOARD_MULTIPLE_DEVICES, deviceIds);
  }

  /**
   * Set dashboard layer
   *
   * @param layerId - Layer ID
   *
   * @example
   * ```typescript
   * ubidots.setDashboardLayer('layer-123');
   * ```
   */
  setDashboardLayer(layerId: string): void {
    this.postMessage(EventTypesEnum.SET_DASHBOARD_LAYER, layerId);
  }

  /**
   * Set dashboard date range
   *
   * @param range - Date range with start and end timestamps
   *
   * @example
   * ```typescript
   * ubidots.setDashboardDateRange({
   *   start: Date.now() - 86400000, // 24 hours ago
   *   end: Date.now()
   * });
   * ```
   */
  setDashboardDateRange(range: DashboardDateRange): void {
    this.postMessage(EventTypesEnum.SET_DASHBOARD_DATE_RANGE, range);
  }

  /**
   * Enable/disable real-time updates
   *
   * @param enableRealTime - Enable real-time flag
   *
   * @example
   * ```typescript
   * ubidots.setRealTime(true);  // Enable real-time
   * ubidots.setRealTime(false); // Disable real-time
   * ```
   */
  setRealTime(enableRealTime: boolean): void {
    this.postMessage(EventTypesEnum.SET_REAL_TIME, enableRealTime);
  }

  /**
   * Refresh dashboard data
   *
   * @example
   * ```typescript
   * ubidots.refreshDashboard();
   * ```
   */
  refreshDashboard(): void {
    this.postMessage(EventTypesEnum.REFRESH_DASHBOARD);
  }

  /**
   * Set fullscreen mode
   *
   * @param fullScreenAction - Fullscreen action ('enter' or 'exit')
   *
   * @example
   * ```typescript
   * ubidots.setFullScreen('enter'); // Enter fullscreen
   * ubidots.setFullScreen('exit');  // Exit fullscreen
   * ```
   */
  setFullScreen(fullScreenAction: string): void {
    this.postMessage(EventTypesEnum.SET_FULL_SCREEN, fullScreenAction);
  }

  /**
   * Open drawer with content
   *
   * @param drawerInfo - Drawer configuration
   *
   * @example
   * ```typescript
   * ubidots.openDrawer({
   *   url: 'https://example.com/widget-config',
   *   width: 400
   * });
   * ```
   */
  openDrawer(drawerInfo: DrawerInfo): void {
    const payload = {
      drawerInfo,
      id: this.widget.getId()
    };
    this.postMessage(EventTypesEnum.OPEN_DRAWER, payload);
  }

  // ============================================================
  // Public API - State Getters
  // ============================================================

  /**
   * Get user authentication token
   *
   * @returns User token or undefined if not available
   *
   * @example
   * ```typescript
   * const token = ubidots.token;
   * if (token) {
   *   // Use token for API calls
   * }
   * ```
   */
  get token(): string | undefined {
    return this._state.token;
  }

  /**
   * Get JWT authentication token
   *
   * @returns JWT token or undefined if not available
   *
   * @example
   * ```typescript
   * const jwtToken = ubidots.jwtToken;
   * if (jwtToken) {
   *   // Use JWT token for API calls
   * }
   * ```
   */
  get jwtToken(): string | undefined {
    return this._state.jwtToken;
  }

  /**
   * Get currently selected device ID
   *
   * @returns Selected device ID or undefined
   *
   * @example
   * ```typescript
   * const deviceId = ubidots.selectedDevice;
   * console.log('Current device:', deviceId);
   * ```
   */
  get selectedDevice(): string | undefined {
    return this._state.selectedDevice;
  }

  /**
   * Get array of selected device IDs
   *
   * @returns Array of selected device IDs or undefined
   *
   * @example
   * ```typescript
   * const devices = ubidots.selectedDevices;
   * if (devices) {
   *   console.log(`${devices.length} devices selected`);
   * }
   * ```
   */
  get selectedDevices(): string[] | undefined {
    return this._state.selectedDevices;
  }

  /**
   * Get array of selected device objects
   *
   * @returns Array of selected device objects or undefined
   *
   * @example
   * ```typescript
   * const deviceObjects = ubidots.selectedDeviceObjects;
   * deviceObjects?.forEach(device => {
   *   console.log('Device:', device.name);
   * });
   * ```
   */
  get selectedDeviceObjects(): DeviceObject[] | undefined {
    return this._state.selectedDeviceObjects;
  }

  /**
   * Get current device object
   *
   * @returns Device object or undefined
   *
   * @example
   * ```typescript
   * const device = ubidots.deviceObject;
   * if (device) {
   *   console.log('Device name:', device.name);
   * }
   * ```
   */
  get deviceObject(): DeviceObject | undefined {
    return this._state.deviceObject;
  }

  /**
   * Get dashboard date range
   *
   * @returns Date range with start and end timestamps or undefined
   *
   * @example
   * ```typescript
   * const dateRange = ubidots.dashboardDateRange;
   * if (dateRange) {
   *   console.log('From:', new Date(dateRange.start));
   *   console.log('To:', new Date(dateRange.end));
   * }
   * ```
   */
  get dashboardDateRange(): DashboardDateRange | undefined {
    return this._state.dashboardDateRange;
  }

  /**
   * Get dashboard object
   *
   * @returns Dashboard object or undefined
   *
   * @example
   * ```typescript
   * const dashboard = ubidots.dashboardObject;
   * if (dashboard) {
   *   console.log('Dashboard:', dashboard.name);
   * }
   * ```
   */
  get dashboardObject(): DashboardObject | undefined {
    return this._state.dashboardObject;
  }

  /**
   * Get selected filters
   *
   * @returns Array of filter objects or undefined
   *
   * @example
   * ```typescript
   * const filters = ubidots.selectedFilters;
   * filters?.forEach(filter => {
   *   console.log(`Filter: ${filter.key} = ${filter.value}`);
   * });
   * ```
   */
  get selectedFilters(): FilterObject[] | undefined {
    return this._state.selectedFilters;
  }

  /**
   * Get real-time mode status
   *
   * @returns True if real-time is enabled, false if disabled, undefined if not set
   *
   * @example
   * ```typescript
   * const isRealTime = ubidots.realTime;
   * if (isRealTime) {
   *   console.log('Real-time mode is active');
   * }
   * ```
   */
  get realTime(): boolean | undefined {
    return this._state.realTime;
  }

  /**
   * Get widget instance
   *
   * @returns Widget instance for accessing widget-specific functionality
   *
   * @example
   * ```typescript
   * const widget = ubidots.getWidget();
   * const settings = widget.getSettings();
   * ```
   */
  getWidget(): WidgetAPI {
    return this.widget;
  }

  /**
   * Get headers for API requests
   *
   * @returns Headers object with authentication and content type
   *
   * @example
   * ```typescript
   * const headers = ubidots.getHeaders();
   * fetch('/api/data', { headers });
   * ```
   */
  getHeaders(): Headers {
    const headers: Headers = {
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
  get getHeader(): Headers {
    return this.getHeaders();
  }

  // ============================================================
  // Private API - State Setters (for backwards compatibility)
  // ============================================================

  /**
   * Set authentication token
   * @private
   */
  _setToken = (token: string): void => {
    this._state.token = token;
    this.emit(EventTypesEnum.RECEIVED_TOKEN, token);
  };

  /**
   * Set JWT token
   * @private
   */
  _setJWTToken = (jwt: string): void => {
    this._state.jwtToken = jwt;
    this.emit(EventTypesEnum.RECEIVED_JWT_TOKEN, jwt);
  };

  /**
   * Set headers
   * @private
   */
  _setHeaders = (headers: Record<string, string> = {}): void => {
    this._state.headers = headers;
    this.emit(EventTypesEnum.RECEIVED_HEADERS, headers);
  };

  /**
   * Set selected device
   * @private
   */
  _setSelectedDevice = (selectedDevice: string): void => {
    this._state.selectedDevice = selectedDevice;
    this.emit(EventTypesEnum.SELECTED_DEVICE, selectedDevice);
  };

  /**
   * Set selected devices array
   * @private
   */
  _setSelectedDevices = (deviceIdsArray: string[]): void => {
    this._state.selectedDevices = deviceIdsArray;
    this.emit(EventTypesEnum.SELECTED_DEVICES, deviceIdsArray);
  };

  /**
   * Set dashboard date range
   * @private
   */
  _setDashboardDateRange = (dashboardDateRange: DashboardDateRange): void => {
    this._state.dashboardDateRange = dashboardDateRange;
    this.emit(EventTypesEnum.SELECTED_DASHBOARD_DATE_RANGE, dashboardDateRange);
  };

  /**
   * Set real-time mode
   * @private
   */
  _setRealTime = (realTime: boolean): void => {
    this._state.realTime = realTime;
    this.emit(EventTypesEnum.IS_REALTIME_ACTIVE, realTime);
  };

  /**
   * Set device object
   * @private
   */
  _setDeviceObject = (deviceObject: DeviceObject): void => {
    this._state.deviceObject = deviceObject;
    this.emit(EventTypesEnum.SELECTED_DEVICE_OBJECT, deviceObject);
  };

  /**
   * Set selected device objects
   * @private
   */
  _setSelectedDeviceObjects = (selectedDeviceObjectsList: DeviceObject[]): void => {
    this._state.selectedDeviceObjects = selectedDeviceObjectsList;
    this.emit(EventTypesEnum.SELECTED_DEVICE_OBJECTS, selectedDeviceObjectsList);
  };

  /**
   * Set dashboard object
   * @private
   */
  _setDashboardObject = (dashboardObject: DashboardObject): void => {
    this._state.dashboardObject = dashboardObject;
    this.emit(EventTypesEnum.SELECTED_DASHBOARD_OBJECT, dashboardObject);
  };

  /**
   * Set selected filters
   * @private
   */
  _setSelectedFilters = (selectedFilters: FilterObject[]): void => {
    this._state.selectedFilters = selectedFilters;
    this.emit(EventTypesEnum.SELECTED_FILTERS, selectedFilters);
  };

  /**
   * Legacy method for backwards compatibility
   * @private
   * @deprecated Use _handleMessage instead
   */
  _listenMessage = this._handleMessage;
}