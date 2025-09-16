/**
 * @fileoverview Ubidots HTML Canvas Library
 * @version 2.0.0
 * @author Sebastian Saldarriaga <sebastian@ubidots.com>
 * @description Ubidots HTML canvas post message library with TypeScript support
 *
 * This library provides a clean interface for widget-dashboard communication
 * using the publish/subscribe pattern with full TypeScript support.
 *
 * @example
 * ```typescript
 * import Ubidots, { EventTypes } from '@ubidots/html-canvas';
 *
 * const ubidots = new Ubidots();
 *
 * // Listen to events
 * ubidots.listen('receivedToken', (token) => {
 *   console.log('Token received:', token);
 * });
 *
 * // Set dashboard device
 * ubidots.setDashboardDevice('device-123');
 * ```
 */

// Main classes
export { default as Ubidots } from './Ubidots';
export { default as EventBus } from './EventBus';
export { Widget } from './Widget';

// Types and interfaces
export type {
  // Core interfaces
  UbidotsAPI,
  WidgetAPI,
  EventBusAPI,

  // Data types
  EventCallback,
  DashboardDateRange,
  DeviceObject,
  DashboardObject,
  WidgetSettings,
  Headers,
  DrawerInfo,
  FilterObject,
  UbidotsState,

  // Event system
  EventDataMap,
  PostMessageData,
  WindowMessageEvent,
} from './types';

// Enums
export { EventTypes } from './types';

// Default export
export { default } from './Ubidots';

/**
 * Create a new Ubidots instance
 *
 * @example
 * ```typescript
 * import { createUbidots } from '@ubidots/html-canvas';
 *
 * const ubidots = createUbidots();
 * ```
 */
export function createUbidots() {
  const Ubidots = require('./Ubidots').default;
  return new Ubidots();
}

/**
 * Library version
 */
export const VERSION = '2.0.0';

/**
 * Library information
 */
export const LIB_INFO = {
  name: 'ubidots-html-canvas',
  version: VERSION,
  description: 'Ubidots HTML canvas post message library',
  author: 'Sebastian Saldarriaga <sebastian@ubidots.com>',
  repository: 'https://github.com/ubidots/ubidots-html-canvas.git',
  license: 'MIT',
} as const;