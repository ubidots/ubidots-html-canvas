export class Widget {
  #settings = {};

  constructor() {
    this.#settings = window._pluginWidgetSettings || {};
  }

  getSettings() {
    return this.#settings;
  }
}
