/**
 * @fileoverview Global type declarations for the Ubidots HTML Canvas library
 */

import type { WidgetSettings } from './index';

declare global {
  /**
   * Window object extensions
   */
  interface Window {
    /** Global widget settings object */
    _pluginWidgetSettings?: WidgetSettings;

    /** Global widget ID */
    widgetId?: string;

    /** Parent window for postMessage communication */
    parent: Window;
  }

  /**
   * Location object with origin property
   */
  interface Location {
    /** Current origin (protocol + host + port) */
    origin: string;
  }
}

export {};