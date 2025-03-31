/**
 * Widget class for managing widget-specific settings and ID.
 * Provides an interface for HTML Canvas widgets to access their settings.
 */
export class Widget {
  #settings;
  #id;

  /**
   * Creates a new Widget instance.
   * @param {string} id - The widget ID.
   */
  constructor(id) {
    this.#settings = window._pluginWidgetSettings || {};
    this.#id = id || '';
  }

  /**
   * Gets the widget settings.
   * @returns {Object} The widget settings.
   */
  getSettings() {
    return this.#settings;
  }

  /**
   * Gets the widget ID.
   * @returns {string} The widget ID.
   */
  getId() {
    return this.#id;
  }
}
