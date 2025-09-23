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

type SupportedVersions = 'v1' | 'v2';

function isValidVersion(version: string): version is SupportedVersions {
  return version === 'v1' || version === 'v2';
}

class Ubidots extends EventEmitter {
  private apiVersion: SupportedVersions;

  constructor(version: string = 'v1') {
    super();

    if (!isValidVersion(version)) {
      throw new Error(`Unsupported API version: ${version}. Supported versions: v1, v2`);
    }

    this.apiVersion = version;
    this.setupPostMessageListener();
    logger.info(`Ubidots initialized with version ${version}`);

    // Emit ready event after initialization
    setTimeout(() => {
      super.emit(EventTypes.READY, { version: this.apiVersion, timestamp: Date.now() });
    }, 0);
  }

  private get supportedEndpoints(): Set<string> {
    return new Set([
      `${this.apiVersion}:${EventTypes.DEVICE_SELECTED}`,
      EventTypes.ERROR,
      EventTypes.DESTROY,
      EventTypes.READY,
    ]);
  }

  private validateEndpoint(event: string, context: string): boolean {
    if (!this.supportedEndpoints.has(event)) {
      const error = new Error(`Unsupported event endpoint: ${event}`);
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
      // Validate message format
      if (!this.isValidPostMessage(event.data)) {
        logger.debug('Invalid message format received');
        return;
      }

      const { event: eventName, payload } = event.data as PostMessageData;

      // Validate endpoint
      if (!this.supportedEndpoints.has(eventName)) {
        const error = new Error(`Unsupported event endpoint from parent: ${eventName}`);
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
// const ubidots = new Ubidots(); // defaults to v1
// const ubidotsV2 = new Ubidots('v2'); // valid version
// const invalidVersion = new Ubidots('v3'); // throws Error, crashes app

// Subscribe to device selection
// ubidots.on('v1:devices:selected', (data) => {
//   console.log('Device selected:', data);
// });

// Subscribe to errors
// ubidots.on(EventTypes.ERROR, (errorData) => {
//   console.error('Ubidots error:', errorData);
// });

// Subscribe to ready event
// ubidots.on(EventTypes.READY, (data) => {
//   console.log('Ubidots ready with version:', data.version);
// });

// Subscribe to destroy event
// ubidots.on(EventTypes.DESTROY, (data) => {
//   console.log('Ubidots instance destroyed at:', data.timestamp);
// });

// Emit device selection event
// ubidots.emit('v1:devices:selected', {
//   deviceId: 'device-123',
//   userId: 'user-456',
//   timestamp: Date.now()
// });
