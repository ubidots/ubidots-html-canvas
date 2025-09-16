class EventBus {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(eventName, callback) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }
    this.subscribers.get(eventName).push(callback);
  }

  unsubscribe(eventName, callback) {
    if (!this.subscribers.has(eventName)) return;

    const callbacks = this.subscribers.get(eventName);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  publish(eventName, data) {
    if (!this.subscribers.has(eventName)) return;

    this.subscribers.get(eventName).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error executing callback for event ${eventName}:`, error);
      }
    });
  }

  clear() {
    this.subscribers.clear();
  }
}

export default EventBus;