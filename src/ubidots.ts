import EventEmitter from './libs/event-emitter';
import logger from './libs/logger';
import noop from './utils/noop';

interface PostMessageData {
  type: 'ubidots:event';
  event: string;
  payload?: any;
}

enum EventTypes {
  DEVICE_SELECTED = 'devices:selected',
  ERROR = 'error',
  DESTROY = 'destroy',
  READY = 'ready',
}

function isValidEventFormat(event: string): boolean {
  // Events can be:
  // - Version-specific: v1:devices:selected, v2:users:created
  // - Version-agnostic: error, ready, destroy
  const versionedPattern = /^v\d+:[a-z:]+$/;
  const versionAgnosticEvents = ['error', 'ready', 'destroy'];

  return versionedPattern.test(event) || versionAgnosticEvents.includes(event);
}

class Ubidots extends EventEmitter {
  constructor() {
    super();

    this.setupPostMessageListener();
    logger.info('Ubidots initialized');

    setTimeout(() => {
      super.emit(EventTypes.READY, { timestamp: Date.now() });
    }, 0);
  }

  private validateEndpoint(event: string, context: string): boolean {
    if (!isValidEventFormat(event)) {
      const error = new Error(
        `Invalid event format: ${event}. Expected format: 'vX:event:name' or version-agnostic events (error, ready, destroy)`
      );
      this.emitError(error, context);
      return false;
    }
    return true;
  }

  private setupPostMessageListener(): void {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      // Validate origin
      if (event.origin !== window.location.origin) {
        logger.debug('Message from invalid origin received', { origin: event.origin });
        return;
      }

      // Validate message format
      if (!this.isValidPostMessage(event.data)) {
        logger.debug('Invalid message format received');
        return;
      }

      const { event: eventName, payload } = event.data as PostMessageData;

      // Validate endpoint format
      if (!isValidEventFormat(eventName)) {
        const error = new Error(`Invalid event format from parent: ${eventName}`);
        this.emitError(error, 'handleMessage');
        return;
      }

      logger.debug(`Received message from parent: ${eventName}`, payload);
      super.emit(eventName, payload);
    } catch (error) {
      this.emitError(error as Error, 'handleMessage');
    }
  }

  private isValidPostMessage(data: any): data is PostMessageData {
    return data && typeof data === 'object' && data.type === 'ubidots:event' && typeof data.event === 'string';
  }

  override on(event: string, handler: (payload?: any) => void): () => void {
    if (!this.validateEndpoint(event, 'on')) return noop;
    return super.on(event, handler);
  }

  override once(event: string, handler: (payload?: any) => void): () => void {
    if (!this.validateEndpoint(event, 'once')) return noop;
    return super.once(event, handler);
  }

  override emit(event: string, payload?: any): void {
    if (!this.validateEndpoint(event, 'emit')) return;
    this.sendToParent(event, payload);
  }

  private sendToParent(event: string, payload?: any): void {
    try {
      if (window.parent && window.parent !== window) {
        const message: PostMessageData = {
          type: 'ubidots:event',
          event,
          payload,
        };

        logger.debug(`Sending message to parent: ${event}`, payload);
        window.parent.postMessage(message, window.location.origin);
      }
    } catch (error) {
      this.emitError(error as Error, 'sendToParent');
    }
  }

  private emitError(error: Error, context?: string): void {
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      timestamp: Date.now(),
    };

    logger.error(`Ubidots error: ${error.message}`, errorData);
    super.emit(EventTypes.ERROR, errorData);
  }

  destroy(): void {
    try {
      super.emit(EventTypes.DESTROY, { timestamp: Date.now() });
      window.removeEventListener('message', this.handleMessage.bind(this));
      this.removeAllListeners();
      logger.info('Ubidots instance destroyed');
    } catch (error) {
      this.emitError(error as Error, 'destroy');
    }
  }
}

export default Ubidots;

// Usage examples:
// const ubidots = new Ubidots();

// Subscribe to device selection events (version specified in event name)
// ubidots.on('v1:devices:selected', (data) => {
//   console.log('Device selected (v1):', data);
// });

// ubidots.on('v2:devices:selected', (data) => {
//   console.log('Device selected (v2):', data);
// });

// Subscribe to errors (version-agnostic)
// ubidots.on('error', (errorData) => {
//   console.error('Ubidots error:', errorData);
// });

// Subscribe to ready event (version-agnostic)
// ubidots.on('ready', (data) => {
//   console.log('Ubidots ready at:', data.timestamp);
// });

// Subscribe to destroy event (version-agnostic)
// ubidots.on('destroy', (data) => {
//   console.log('Ubidots instance destroyed at:', data.timestamp);
// });

// Emit device selection event (specify version in event name)
// ubidots.emit('v1:devices:selected', {
//   deviceId: 'device-123',
//   userId: 'user-456',
//   timestamp: Date.now()
// });

// Emit with different version
// ubidots.emit('v2:devices:selected', {
//   deviceId: 'device-456',
//   timestamp: Date.now()
// });
