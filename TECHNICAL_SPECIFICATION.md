# Ubidots HTML Canvas - Event System Specification

## Overview

The Ubidots HTML Canvas library provides a high-performance, type-safe event system for building interactive widgets.
This specification covers the usage patterns, event validation, and integration guidelines for developers.

## Core Architecture

### Event-Driven Communication

The library implements a centralized event system with strict endpoint validation to ensure reliable communication
between widgets and the Ubidots dashboard.

### Key Components

1. **EventEmitter**: High-performance observer pattern implementation for multiple listeners per event (vs legacy's
   single callback approach)
2. **Ubidots Class**: Main interface extending EventEmitter with endpoint validation
3. **PostMessage Bridge**: Secure communication between iframe widgets and parent dashboard
4. **Error Handling**: Centralized error reporting and event emission system

## Getting Started

### Installation & Setup

```javascript
import Ubidots, { ApiVersions } from '@ubidots/html-canvas';

// Use default version (v1)
const ubidots = new Ubidots();

// Or specify a version
const ubidotsV2 = new Ubidots(ApiVersions.V2);
const ubidotsCustom = new Ubidots('v3'); // Custom version string
```

### Basic Usage

```javascript
// Subscribe to events
const unsubscribe = ubidots.on('v1:devices:selected', data => {
  console.log('Device selected:', data);
});

// Emit events
ubidots.emit('v1:devices:selected', {
  deviceId: 'device-123',
  userId: 'user-456',
  timestamp: Date.now(),
});

// Clean up when done
unsubscribe();
```

## Event System Features

### Communication Architecture

The library implements **unidirectional communication** between iframe widgets and the parent dashboard:

**Child → Parent (Outbound):**

- `emit()` method sends events to parent dashboard via `postMessage`
- Does NOT trigger local event handlers

**Parent → Child (Inbound):**

- Parent sends events via `postMessage`
- `on()` method registers handlers for events coming from parent
- EventEmitter distributes these events to local handlers

This prevents communication loops and follows the same pattern as the legacy Ubidots library.

### API Versioning System

The library supports multiple API versions to ensure backward compatibility and enable feature evolution:

```javascript
import Ubidots, { ApiVersions, EventTypes } from '@ubidots/html-canvas';

// Initialize with different versions
const ubidotsV1 = new Ubidots(ApiVersions.V1); // or new Ubidots() for default
const ubidotsV2 = new Ubidots(ApiVersions.V2);
const ubidotsCustom = new Ubidots('v3'); // Custom version string

// Version-specific endpoints are automatically generated
ubidotsV1.on('v1:devices:selected', handleV1Device);
ubidotsV2.on('v2:devices:selected', handleV2Device);
```

#### Version-Specific Features

Each API version supports the same event types but with version-specific namespacing:

- **v1**: `v1:devices:selected`, `v1:users:created`, etc.
- **v2**: `v2:devices:selected`, `v2:users:created`, etc.
- **Custom**: `{version}:devices:selected`, etc.

#### Backward Compatibility

Different versions can coexist in the same application:

```javascript
// Legacy widget using v1
const legacyWidget = new Ubidots(ApiVersions.V1);
legacyWidget.on('v1:devices:selected', handleLegacyFormat);

// New widget using v2
const modernWidget = new Ubidots(ApiVersions.V2);
modernWidget.on('v2:devices:selected', handleModernFormat);
```

### Supported Endpoints

Currently supported event types (available in all versions):

- `{version}:devices:selected` - Device selection events
- `error` - Internal library errors and exceptions (version-agnostic)
- `destroy` - Library cleanup events (version-agnostic)

### Endpoint Validation

The library validates all event subscriptions and emissions against a whitelist of supported endpoints:

```javascript
// ✅ Valid - will work
ubidots.on('v1:devices:selected', callback);

// ❌ Invalid - will emit error event, returns safe unsubscribe function
const unsubscribe = ubidots.on('v1:devices:unsupported', callback);
// Emits: { message: "Unsupported event endpoint: v1:devices:unsupported", context: "on" }
// Returns: safe noop function for cleanup
```

### Event Handler Features

#### One-time Subscriptions

```javascript
// Listen only once
const unsubscribe = ubidots.once('v1:devices:selected', data => {
  console.log('First device selection:', data);
  // Automatically unsubscribes after first event
});
```

#### Multiple Listeners

Unlike the legacy library which supports only one callback per event, this implementation allows multiple listeners:

```javascript
// Multiple handlers for same event (legacy: only one callback possible)
ubidots.on('v1:devices:selected', logDeviceSelection);
ubidots.on('v1:devices:selected', updateUI);
ubidots.on('v1:devices:selected', sendAnalytics);
```

#### Error Isolation

```javascript
// If one handler fails, others continue working
ubidots.on('v1:devices:selected', data => {
  throw new Error('Handler failed!');
});

ubidots.on('v1:devices:selected', data => {
  console.log('This still works!'); // ✅ Executes normally
});
```

## Event Data Structure

### Standard Event Format

```javascript
{
  deviceId: string,
  userId?: string,
  timestamp: number,
  metadata?: any
}
```

### Example Event Data

```javascript
ubidots.emit('v1:devices:selected', {
  deviceId: 'device-abc123',
  userId: 'user-xyz789',
  timestamp: 1695123456789,
  metadata: {
    source: 'widget-interaction',
    location: { lat: 40.7128, lng: -74.006 },
  },
});
```

## Error Handling

### Centralized Error System

The library provides a comprehensive error handling system that automatically captures and reports internal errors:

```javascript
// Subscribe to all library errors
ubidots.on('error', errorData => {
  console.error('Library error:', errorData);
  // errorData contains: { message, name, stack, context, timestamp }
});
```

### Error Data Structure

Error events contain structured information:

```javascript
{
  message: string,    // Error description
  name: string,       // Error type (e.g., "TypeError")
  stack: string,      // Stack trace for debugging
  context: string,    // Where the error occurred (e.g., "handleMessage")
  timestamp: number   // When the error occurred
}
```

### Automatic Error Reporting

The library automatically emits error events for:

- **Invalid postMessage communications** from parent window
- **Unsupported event endpoints** from external sources
- **Communication failures** when sending messages to parent
- **Internal exceptions** during message processing

### Graceful Error Handling

The library follows a **non-breaking approach** - it never throws exceptions that could crash your application. Instead,
it emits error events for monitoring while continuing to operate:

```javascript
// ❌ This won't crash your app
const unsubscribe = ubidots.on('invalid:endpoint', callback);
// Returns a safe unsubscribe function, emits error event

// ❌ This won't crash your app either
ubidots.emit('unsupported:event', data);
// Fails silently, emits error event

// ✅ Monitor these graceful failures
ubidots.on('error', errorData => {
  if (errorData.context === 'on') {
    console.warn('Attempted to subscribe to invalid endpoint:', errorData.message);
  }
  if (errorData.context === 'emit') {
    console.warn('Attempted to emit unsupported event:', errorData.message);
  }
});
```

### Error Context Information

Error events include context about where the error occurred:

- **`context: 'on'`** - Error during event subscription
- **`context: 'once'`** - Error during one-time subscription
- **`context: 'emit'`** - Error during event emission
- **`context: 'handleMessage'`** - Error processing incoming messages
- **`context: 'sendToParent'`** - Error sending messages to parent window
- **`context: 'destroy'`** - Error during cleanup

### Handler Errors

Individual event handler errors are logged but don't affect other handlers:

```javascript
ubidots.on('v1:devices:selected', () => {
  throw new Error('Oops!'); // Logged but doesn't break other handlers
});

ubidots.on('v1:devices:selected', () => {
  console.log('Still works!'); // ✅ Continues to execute
});
```

## Best Practices

### Memory Management

Individual listener management (not available in legacy library):

```javascript
// Store unsubscribe functions for individual listeners
const unsubscribeDevice = ubidots.on('v1:devices:selected', handleDevice);
const unsubscribeUser = ubidots.on('v1:users:updated', handleUser);

// Clean up individual listeners when component unmounts
function cleanup() {
  unsubscribeDevice(); // Remove only this specific handler
  unsubscribeUser(); // Remove only this specific handler

  // Or clean up all listeners at once
  ubidots.destroy();
}
```

### Error Monitoring

```javascript
// Set up comprehensive error monitoring
ubidots.on('error', errorData => {
  // Log for debugging
  console.warn('Ubidots error:', errorData);

  // Send to analytics/monitoring service
  analytics.track('ubidots_error', {
    message: errorData.message,
    context: errorData.context,
    timestamp: errorData.timestamp,
  });

  // Handle specific error contexts
  switch (errorData.context) {
    case 'handleMessage':
      // Communication issue with dashboard
      showConnectionWarning();
      break;
    case 'on':
    case 'emit':
      // Developer error - invalid endpoint usage
      if (isDevelopment) {
        console.error('Invalid endpoint usage:', errorData.message);
      }
      break;
  }
});
```

### Resilient Event Handling

```javascript
// The library handles errors gracefully, but validate your data
ubidots.on('v1:devices:selected', data => {
  // Always validate incoming data
  if (!data || !data.deviceId) {
    console.warn('Invalid device selection data received');
    return;
  }

  try {
    handleDeviceSelection(data.deviceId);
  } catch (error) {
    // Handle your own errors appropriately
    console.error('Error processing device selection:', error);
  }
});
```

### Event Data Validation

```javascript
ubidots.on('v1:devices:selected', data => {
  // Validate required fields
  if (!data.deviceId) {
    console.error('Missing deviceId in event data');
    return;
  }

  // Process validated data
  handleDeviceSelection(data.deviceId);
});
```

## Performance Characteristics

### Optimized Operations

- **O(1) event registration and lookup** using Map/Set structures (vs legacy's O(1) object property access)
- **Memory efficient** with automatic cleanup of empty listener sets
- **Error isolation** prevents one failing handler from affecting others (legacy: no isolation)
- **Multiple listeners support** without performance degradation (legacy: single callback only)

### Scalability vs Legacy

- **Multiple listeners per event** (legacy: one callback per event, newer overwrites previous)
- **Individual listener cleanup** (legacy: no individual unsubscribe capability)
- **Advanced features**: `once()`, `listenerCount()`, `removeAllListeners()` (not available in legacy)
- **Error isolation**: failing handlers don't affect others (legacy: no isolation)

## Integration Examples

### Widget Development

```javascript
class DeviceWidget {
  constructor() {
    this.ubidots = new Ubidots();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Listen for device changes
    this.unsubscribeDevice = this.ubidots.on('v1:devices:selected', this.handleDeviceChange.bind(this));

    // Listen for library errors
    this.unsubscribeError = this.ubidots.on('error', this.handleError.bind(this));
  }

  handleDeviceChange(data) {
    console.log('Updating widget for device', data.deviceId);
    this.updateDisplay(data.deviceId);
  }

  handleError(errorData) {
    console.error('Widget error:', errorData);
    this.showErrorMessage(`Communication error: ${errorData.message}`);
  }

  destroy() {
    // Clean up event listeners
    this.unsubscribeDevice();
    this.unsubscribeError();

    // Clean up the library instance
    this.ubidots.destroy();
  }
}
```

### Cross-Frame Communication

```javascript
class WidgetState {
  constructor() {
    this.ubidots = new Ubidots();
    this.state = { currentDevice: null };
    this.setupStateSync();
  }

  setupStateSync() {
    // Listen for device changes from dashboard
    this.ubidots.on('v1:devices:selected', data => {
      this.state.currentDevice = data.deviceId;
      this.notifyStateChange();
    });

    // Listen for communication errors
    this.ubidots.on('error', errorData => {
      if (errorData.context === 'handleMessage') {
        console.warn('Lost connection to dashboard');
        this.handleConnectionLoss();
      }
    });
  }

  selectDevice(deviceId) {
    // This sends a message to the parent dashboard
    // The parent will then notify all widgets (including this one) via postMessage
    this.ubidots.emit('v1:devices:selected', {
      deviceId,
      timestamp: Date.now(),
    });
  }

  handleConnectionLoss() {
    // Show user that connection is lost
    this.showConnectionStatus('disconnected');
  }
}
```

## Future Extensibility

### Adding New Endpoints

To support new event types, extend the supported endpoints:

```javascript
// In library configuration
private supportedEndpoints: Set<string> = new Set([
  'v1:devices:selected',
  'v1:users:created',     // New user events
  'v2:devices:updated'    // Version 2 events
]);
```

### Wildcard Support (Future)

Planned support for wildcard patterns:

```javascript
// Future capability
ubidots.on('v1:devices:*', handleAnyDeviceEvent);
ubidots.on('v1:*:selected', handleAnySelection);
```

## Security Considerations

### Communication Security

- **Origin validation** ensures messages are sent only to the same origin as the widget
- **Message type filtering** processes only `ubidots:event` type messages, ignoring other postMessage traffic
- **Endpoint validation** prevents unauthorized event patterns
- **Structured message format** validates incoming message structure before processing

### Error Safety

- **Error message safety** provides helpful info without exposing internal implementation details
- **Input validation** recommended for all event data processing
- **Memory safety** through automatic cleanup and bounded operations
- **Graceful degradation** continues operation even when communication with parent fails

### Best Security Practices

- Always validate event data in your handlers
- Use the error event to monitor for potential security issues
- Call `destroy()` when your widget is no longer needed to clean up listeners
- Never trust event data without validation, even from the parent dashboard

### Reliability Features

- **Non-breaking design** - Invalid operations emit errors instead of throwing exceptions
- **Graceful degradation** - Library continues to function even when encountering errors
- **Safe unsubscribe functions** - Invalid subscriptions return safe cleanup functions
- **Silent failure mode** - Invalid emissions fail silently while reporting errors
- **Comprehensive error context** - All errors include context about where they occurred
- **Memory-safe operations** - Automatic cleanup prevents memory leaks

## Dependencies

- **TypeScript** for full type safety
- **Modern JavaScript** (ES6+ features: Map, Set, arrow functions)
- **Zero external dependencies** for lightweight integration
