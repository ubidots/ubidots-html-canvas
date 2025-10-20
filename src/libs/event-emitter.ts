import logger from './logger';

type EventHandler = (payload?: any) => void;

class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  once(event: string, handler: EventHandler): () => void {
    const onceHandler = (payload?: any) => {
      handler(payload);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }

  off(event: string, handler?: EventHandler): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    } else {
      this.events.delete(event);
    }
  }

  emit(event: string, payload?: any): void {
    const handlers = this.events.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        logger.error(`Error in event handler for '${event}'`, error);
      }
    }
  }

  removeAllListeners(): void {
    this.events.clear();
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

export default EventEmitter;
