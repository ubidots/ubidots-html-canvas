import type { WidgetSettings, WidgetAPI } from './types';

/**
 * @category Widget
 * Widget class for managing HTML Canvas widget settings and configuration
 *
 * @example
 * ```typescript
 * const widget = new Widget('my-widget-id');
 * const settings = widget.getSettings();
 * const id = widget.getId();
 * ```
 */
export class Widget implements WidgetAPI {
  /** Private widget settings */
  #settings: WidgetSettings;

  /** Private widget ID */
  #id: string | undefined;

  /**
   * Create a new Widget instance
   *
   * @param id - Optional widget identifier
   *
   * @example
   * ```typescript
   * // Create widget with ID
   * const widget = new Widget('widget-123');
   *
   * // Create widget without ID (will use window.widgetId)
   * const widget = new Widget();
   * ```
   */
  constructor(id?: string) {
    // Get settings from global window object or default to empty object
    this.#settings = window._pluginWidgetSettings ?? {};

    // Use provided ID or fallback to window.widgetId
    this.#id = id ?? window.widgetId;
  }

  /**
   * Get the widget settings
   *
   * @returns Widget settings object
   *
   * @example
   * ```typescript
   * const settings = widget.getSettings();
   * console.log('Widget config:', settings.config);
   * ```
   */
  getSettings(): WidgetSettings {
    return this.#settings;
  }

  /**
   * Get the widget ID
   *
   * @returns Widget identifier or undefined if not set
   *
   * @example
   * ```typescript
   * const id = widget.getId();
   * if (id) {
   *   console.log('Widget ID:', id);
   * }
   * ```
   */
  getId(): string | undefined {
    return this.#id;
  }

  /**
   * Update widget settings
   *
   * @param newSettings - New settings to merge with existing ones
   *
   * @example
   * ```typescript
   * widget.updateSettings({
   *   theme: 'dark',
   *   refreshInterval: 5000
   * });
   * ```
   */
  updateSettings(newSettings: Partial<WidgetSettings>): void {
    this.#settings = { ...this.#settings, ...newSettings };
  }

  /**
   * Get a specific setting value
   *
   * @param key - Setting key to retrieve
   * @returns Setting value or undefined if not found
   *
   * @example
   * ```typescript
   * const theme = widget.getSetting('theme');
   * const refreshRate = widget.getSetting('refreshInterval') as number;
   * ```
   */
  getSetting<T = unknown>(key: string): T | undefined {
    return this.#settings[key] as T | undefined;
  }

  /**
   * Set a specific setting value
   *
   * @param key - Setting key to set
   * @param value - Value to set
   *
   * @example
   * ```typescript
   * widget.setSetting('theme', 'dark');
   * widget.setSetting('refreshInterval', 3000);
   * ```
   */
  setSetting(key: string, value: unknown): void {
    this.#settings[key] = value;
  }

  /**
   * Check if a setting exists
   *
   * @param key - Setting key to check
   * @returns True if the setting exists
   *
   * @example
   * ```typescript
   * if (widget.hasSetting('apiKey')) {
   *   const apiKey = widget.getSetting('apiKey');
   * }
   * ```
   */
  hasSetting(key: string): boolean {
    return key in this.#settings;
  }

  /**
   * Remove a setting
   *
   * @param key - Setting key to remove
   *
   * @example
   * ```typescript
   * widget.removeSetting('temporaryFlag');
   * ```
   */
  removeSetting(key: string): void {
    delete this.#settings[key];
  }

  /**
   * Get all setting keys
   *
   * @returns Array of setting keys
   *
   * @example
   * ```typescript
   * const keys = widget.getSettingKeys();
   * console.log('Available settings:', keys);
   * ```
   */
  getSettingKeys(): string[] {
    return Object.keys(this.#settings);
  }

  /**
   * Clear all settings
   *
   * @example
   * ```typescript
   * widget.clearSettings();
   * ```
   */
  clearSettings(): void {
    this.#settings = {};
  }

  /**
   * Get a copy of the widget state for serialization
   *
   * @returns Serializable widget state
   *
   * @example
   * ```typescript
   * const state = widget.toJSON();
   * localStorage.setItem('widgetState', JSON.stringify(state));
   * ```
   */
  toJSON(): { id: string | undefined; settings: WidgetSettings } {
    return {
      id: this.#id,
      settings: { ...this.#settings }
    };
  }
}