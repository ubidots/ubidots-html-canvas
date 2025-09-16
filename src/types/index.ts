/**
 * @fileoverview Type definitions for the Ubidots HTML Canvas library
 */

/**
 * Generic event callback function type
 * @template T - The type of data passed to the callback
 */
export type EventCallback<T = unknown> = (data: T) => void;

/**
 * Date range interface for dashboard filtering
 */
export interface DashboardDateRange {
  /** Start timestamp in milliseconds */
  start: number;
  /** End timestamp in milliseconds */
  end: number;
}

/**
 * Device object interface
 */
export interface DeviceObject {
  /** Unique device identifier */
  id: string;
  /** Device name */
  name: string;
  /** Device label */
  label?: string;
  /** Additional device properties */
  [key: string]: unknown;
}

/**
 * Dashboard object interface
 */
export interface DashboardObject {
  /** Unique dashboard identifier */
  id: string;
  /** Dashboard name */
  name: string;
  /** Dashboard configuration */
  config?: Record<string, unknown>;
  /** Additional dashboard properties */
  [key: string]: unknown;
}

/**
 * Widget settings interface
 */
export interface WidgetSettings {
  /** Widget-specific configuration */
  [key: string]: unknown;
}

/**
 * HTTP headers interface
 */
export interface Headers {
  /** Content type header */
  'Content-Type': string;
  /** Authentication token header */
  'X-Auth-Token'?: string;
  /** JWT authorization header */
  'Authorization'?: string;
  /** Additional headers */
  [key: string]: string | undefined;
}

/**
 * Drawer information interface
 */
export interface DrawerInfo {
  /** URL to load in the drawer */
  url: string;
  /** Drawer width in pixels */
  width?: number;
  /** Additional drawer configuration */
  [key: string]: unknown;
}

/**
 * Filter object interface
 */
export interface FilterObject {
  /** Filter key */
  key: string;
  /** Filter value */
  value: unknown;
  /** Filter operator */
  operator?: string;
}

/**
 * Internal state interface for Ubidots class
 */
export interface UbidotsState {
  /** User authentication token */
  token: string | undefined;
  /** JWT authentication token */
  jwtToken: string | undefined;
  /** HTTP headers for API requests */
  headers: Record<string, string>;
  /** Currently selected device ID */
  selectedDevice: string | undefined;
  /** Array of selected device IDs */
  selectedDevices: string[] | undefined;
  /** Array of selected device objects */
  selectedDeviceObjects: DeviceObject[] | undefined;
  /** Current device object */
  deviceObject: DeviceObject | undefined;
  /** Dashboard date range */
  dashboardDateRange: DashboardDateRange | undefined;
  /** Dashboard object */
  dashboardObject: DashboardObject | undefined;
  /** Selected filters */
  selectedFilters: FilterObject[] | undefined;
  /** Real-time mode status */
  realTime: boolean | undefined;
}

/**
 * Event types enumeration
 */
export enum EventTypes {
  IS_REALTIME_ACTIVE = 'isRealTimeActive',
  OPEN_DRAWER = 'openDrawer',
  RECEIVED_HEADERS = 'receivedHeaders',
  RECEIVED_JWT_TOKEN = 'receivedJWTToken',
  RECEIVED_TOKEN = 'receivedToken',
  REFRESH_DASHBOARD = 'refreshDashboard',
  SELECTED_DASHBOARD_DATE_RANGE = 'selectedDashboardDateRange',
  SELECTED_DASHBOARD_OBJECT = 'selectedDashboardObject',
  SELECTED_DEVICE = 'selectedDevice',
  SELECTED_DEVICES = 'selectedDevices',
  SELECTED_DEVICE_OBJECT = 'selectedDeviceObject',
  SELECTED_DEVICE_OBJECTS = 'selectedDeviceObjects',
  SELECTED_FILTERS = 'selectedFilters',
  SET_DASHBOARD_DATE_RANGE = 'setDashboardDateRange',
  SET_DASHBOARD_DEVICE = 'setDashboardDevice',
  SET_DASHBOARD_LAYER = 'setDashboardLayer',
  SET_DASHBOARD_MULTIPLE_DEVICES = 'setDashboardMultipleDevices',
  SET_FULL_SCREEN = 'setFullScreen',
  SET_REAL_TIME = 'setRealTime',
  READY = 'ready',
  DASHBOARD_REFRESHED = 'dashboardRefreshed',
}

/**
 * Event data mapping interface
 */
export interface EventDataMap {
  [EventTypes.IS_REALTIME_ACTIVE]: boolean;
  [EventTypes.OPEN_DRAWER]: { drawerInfo: DrawerInfo; id: string };
  [EventTypes.RECEIVED_HEADERS]: Record<string, string>;
  [EventTypes.RECEIVED_JWT_TOKEN]: string;
  [EventTypes.RECEIVED_TOKEN]: string;
  [EventTypes.REFRESH_DASHBOARD]: undefined;
  [EventTypes.SELECTED_DASHBOARD_DATE_RANGE]: DashboardDateRange;
  [EventTypes.SELECTED_DASHBOARD_OBJECT]: DashboardObject;
  [EventTypes.SELECTED_DEVICE]: string;
  [EventTypes.SELECTED_DEVICES]: string[];
  [EventTypes.SELECTED_DEVICE_OBJECT]: DeviceObject;
  [EventTypes.SELECTED_DEVICE_OBJECTS]: DeviceObject[];
  [EventTypes.SELECTED_FILTERS]: FilterObject[];
  [EventTypes.SET_DASHBOARD_DATE_RANGE]: DashboardDateRange;
  [EventTypes.SET_DASHBOARD_DEVICE]: string;
  [EventTypes.SET_DASHBOARD_LAYER]: string;
  [EventTypes.SET_DASHBOARD_MULTIPLE_DEVICES]: string[];
  [EventTypes.SET_FULL_SCREEN]: string;
  [EventTypes.SET_REAL_TIME]: boolean;
  [EventTypes.READY]: undefined;
  [EventTypes.DASHBOARD_REFRESHED]: undefined;
}

/**
 * Post message data interface
 */
export interface PostMessageData {
  /** Event name */
  event: string;
  /** Event payload */
  payload?: unknown;
}

/**
 * Window message event interface
 */
export interface WindowMessageEvent {
  /** Message origin */
  origin: string;
  /** Message data */
  data: PostMessageData;
}

/**
 * Ubidots API interface
 */
export interface UbidotsAPI {
  /** Subscribe to events */
  on<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  on(eventName: string, callback: EventCallback): void;

  /** Subscribe to events (alias) */
  listen<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  listen(eventName: string, callback: EventCallback): void;

  /** Unsubscribe from events */
  off<K extends keyof EventDataMap>(
    eventName: K,
    callback: EventCallback<EventDataMap[K]>
  ): void;
  off(eventName: string, callback: EventCallback): void;

  /** Emit events */
  emit<K extends keyof EventDataMap>(
    eventName: K,
    data: EventDataMap[K]
  ): void;
  emit(eventName: string, data?: unknown): void;

  /** Send message to parent window */
  postMessage(event: string, payload?: unknown): void;

  /** Set dashboard device */
  setDashboardDevice(deviceId: string): void;

  /** Set multiple dashboard devices */
  setDashboardMultipleDevices(deviceIds: string[]): void;

  /** Set dashboard layer */
  setDashboardLayer(layerId: string): void;

  /** Set dashboard date range */
  setDashboardDateRange(range: DashboardDateRange): void;

  /** Enable/disable real-time updates */
  setRealTime(enableRealTime: boolean): void;

  /** Refresh dashboard */
  refreshDashboard(): void;

  /** Set fullscreen mode */
  setFullScreen(fullScreenAction: string): void;

  /** Open drawer */
  openDrawer(drawerInfo: DrawerInfo): void;

  /** Get authentication token */
  readonly token: string | undefined;

  /** Get JWT token */
  readonly jwtToken: string | undefined;

  /** Get selected device */
  readonly selectedDevice: string | undefined;

  /** Get selected devices */
  readonly selectedDevices: string[] | undefined;

  /** Get selected device objects */
  readonly selectedDeviceObjects: DeviceObject[] | undefined;

  /** Get device object */
  readonly deviceObject: DeviceObject | undefined;

  /** Get dashboard date range */
  readonly dashboardDateRange: DashboardDateRange | undefined;

  /** Get dashboard object */
  readonly dashboardObject: DashboardObject | undefined;

  /** Get selected filters */
  readonly selectedFilters: FilterObject[] | undefined;

  /** Get real-time status */
  readonly realTime: boolean | undefined;

  /** Get headers for API requests */
  getHeaders(): Headers;

  /** Get widget instance */
  getWidget(): WidgetAPI;
}

/**
 * Widget API interface
 */
export interface WidgetAPI {
  /** Get widget settings */
  getSettings(): WidgetSettings;

  /** Get widget ID */
  getId(): string | undefined;
}

/**
 * Event bus interface
 */
export interface EventBusAPI {
  /** Subscribe to an event */
  subscribe(eventName: string, callback: EventCallback): void;

  /** Unsubscribe from an event */
  unsubscribe(eventName: string, callback: EventCallback): void;

  /** Publish an event */
  publish(eventName: string, data?: unknown): void;

  /** Clear all subscriptions */
  clear(): void;
}