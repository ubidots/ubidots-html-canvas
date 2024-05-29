export class Widget {
  #settings = {};
  #id = '';

  constructor(id) {
    this.#settings = window._pluginWidgetSettings || {};
    this.#id = id;
  }

  getSettings() {
    return this.#settings;
  }

  getId() {
    return this.#id;
  }
}
