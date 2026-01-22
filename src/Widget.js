export class Widget {
  #settings = {};
  #id = '';
  #variables = [];
  #data = null;
  #error = null;

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

  /**
   * Get the widget variables
   * @returns {Array} The widget variables
   */
  getVariables() {
    return this.#variables;
  }

  /**
   * Set the widget variables
   * @param {Array} variables - The variables to set
   */
  setVariables(variables) {
    this.#variables = variables;
  }

  /**
   * Get the widget data
   * @returns {*} The widget data
   */
  getData() {
    return this.#data;
  }

  /**
   * Set the widget data
   * @param {*} data - The data to set
   */
  setData(data) {
    this.#data = data;
  }

  /**
   * Get the widget error
   * @returns {*} The widget error
   */
  getError() {
    return this.#error;
  }

  /**
   * Set the widget error
   * @param {*} error - The error to set
   */
  setError(error) {
    this.#error = error;
  }
}
