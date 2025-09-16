import type { EventCallback, EventBusAPI } from './types';

/**
 * @category Event System
 * Event bus implementation for the publish/subscribe pattern
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 *
 * // Subscribe to events
 * eventBus.subscribe('userLogin', (userData) => {
 *   console.log('User logged in:', userData);
 * });
 *
 * // Publish events
 * eventBus.publish('userLogin', { id: 123, name: 'John' });
 *
 * // Unsubscribe
 * eventBus.unsubscribe('userLogin', callback);
 * ```
 */
export default class EventBus implements EventBusAPI {
  /** Map of event names to their callback arrays */
  private readonly subscribers: Map<string, EventCallback[]>;

  /**
   * Create a new EventBus instance
   */
  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Subscribe to an event
   *
   * @param eventName - Name of the event to subscribe to
   * @param callback - Function to call when the event is published
   *
   * @example
   * ```typescript
   * eventBus.subscribe('dataUpdate', (data) => {
   *   console.log('Received data:', data);
   * });
   * ```
   */
  subscribe(eventName: string, callback: EventCallback): void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }

    const callbacks = this.subscribers.get(eventName);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  /**
   * Unsubscribe from an event
   *
   * @param eventName - Name of the event to unsubscribe from
   * @param callback - Specific callback function to remove
   *
   * @example
   * ```typescript
   * const callback = (data) => console.log(data);
   * eventBus.subscribe('test', callback);
   * eventBus.unsubscribe('test', callback);
   * ```
   */
  unsubscribe(eventName: string, callback: EventCallback): void {
    if (!this.subscribers.has(eventName)) {
      return;
    }

    const callbacks = this.subscribers.get(eventName);
    if (!callbacks) {
      return;
    }

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Publish an event to all subscribers
   *
   * @param eventName - Name of the event to publish
   * @param data - Data to pass to all event callbacks
   *
   * @example
   * ```typescript
   * eventBus.publish('statusChange', { status: 'active', timestamp: Date.now() });
   * ```
   */
  publish(eventName: string, data?: unknown): void {
    if (!this.subscribers.has(eventName)) {
      return;
    }

    const callbacks = this.subscribers.get(eventName);
    if (!callbacks) {
      return;
    }

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error executing callback for event ${eventName}:`, error);
      }
    });
  }

  /**
   * Clear all event subscriptions
   *
   * @example
   * ```typescript
   * eventBus.clear(); // Removes all subscriptions
   * ```
   */
  clear(): void {
    this.subscribers.clear();
  }

  /**
   * Get the number of subscribers for a specific event
   *
   * @param eventName - Name of the event
   * @returns Number of subscribers for the event
   *
   * @example
   * ```typescript
   * const count = eventBus.getSubscriberCount('dataUpdate');
   * console.log(`${count} subscribers for dataUpdate`);
   * ```
   */
  getSubscriberCount(eventName: string): number {
    const callbacks = this.subscribers.get(eventName);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * Get all event names that have subscribers
   *
   * @returns Array of event names
   *
   * @example
   * ```typescript
   * const events = eventBus.getEventNames();
   * console.log('Active events:', events);
   * ```
   */
  getEventNames(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Check if an event has any subscribers
   *
   * @param eventName - Name of the event to check
   * @returns True if the event has subscribers
   *
   * @example
   * ```typescript
   * if (eventBus.hasSubscribers('importantEvent')) {
   *   eventBus.publish('importantEvent', data);
   * }
   * ```
   */
  hasSubscribers(eventName: string): boolean {
    return this.getSubscriberCount(eventName) > 0;
  }
}